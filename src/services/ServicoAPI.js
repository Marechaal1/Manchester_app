import httpClient from './httpClient';
import { CONFIGURACAO_API } from '../config/ConfiguracaoAPI';
import { formatTriagemData, formatReavaliacaoData, formatSAEData, formatAtendimentoData } from '../utils/apiDataFormatter';

// httpClient já lida com headers, timeout e token via interceptors

// Serviços de autenticação
export const servicoAutenticacao = {
  async fazerLogin(email, senha) {
    try {
      console.log('🔐 Tentando fazer login com:', email);
      // Mostrar URL completa de forma correta
      const base = String(httpClient.defaults.baseURL || '').replace(/\/+$/, '');
      const full = `${base}/login`;
      console.log('🔗 URL completa será:', full);
      
      const resposta = await httpClient.post('/login', { email, password: senha });
      console.log('✅ Login bem-sucedido:', resposta.data);
      const { dados } = resposta.data;
      
      if (dados.token) {
        // o armazenamento é responsabilidade do contexto de autenticação
      }
      
      return resposta.data;
    } catch (erro) {
      console.error('❌ Erro no login completo:', {
        message: erro.message,
        code: erro.code,
        response: erro.response ? {
          status: erro.response.status,
          data: erro.response.data
        } : null,
        request: erro.request ? 'Request feito mas sem resposta' : null,
        stack: erro.stack
      });
      
      // Melhorar mensagem de erro
      if (erro.response) {
        // Erro com resposta do servidor
        const mensagem = erro.response.data?.mensagem || `Erro ${erro.response.status}: ${erro.response.statusText}`;
        throw new Error(mensagem);
      } else if (erro.request) {
        // Requisição feita mas sem resposta - problema de rede
        const base = String(erro.config?.baseURL || '').replace(/\/+$/, '');
        const path = String(erro.config?.url || '').replace(/^\/+/, '');
        const url = base && path ? `${base}/${path}` : (base || path || 'servidor');
        throw new Error(`Não foi possível conectar ao servidor (${url}). Verifique:\n1. Se o backend está rodando em http://172.16.49.67:8080\n2. Se o celular está na MESMA rede Wi‑Fi do servidor\n3. Se o firewall permite conexões na porta 8080 e o serviço escuta em 0.0.0.0`);
      } else if (erro.code === 'NETWORK_ERROR' || erro.code === 'ECONNREFUSED' || erro.code === 'ETIMEDOUT' || erro.message?.includes('Network') || erro.message?.includes('timeout') || erro.message?.includes('ECONNREFUSED')) {
        throw new Error(`Erro de conexão de rede. Código: ${erro.code || 'N/A'}\nVerifique sua conexão Wi-Fi e se o backend está acessível.`);
      } else {
        throw new Error(erro.message || 'Erro ao fazer login. Tente novamente.');
      }
    }
  },

  async fazerLogout() {
    try {
      await httpClient.post('/logout');
    } catch (erro) {
      console.error('Erro ao fazer logout:', erro);
    } finally {
      // limpeza de storage no contexto
    }
  },

  async obterUsuarioAtual() {
    try {
      const resposta = await httpClient.get('/me');
      return resposta.data.dados;
    } catch (erro) {
      throw new Error(erro.response?.data?.mensagem || 'Erro ao obter dados do usuário');
    }
  },
};

// Serviços de pacientes
export const servicoPacientes = {
  async obterPacientes() {
    try {
      const resposta = await httpClient.get('/pacientes');
      return resposta.data;
    } catch (erro) {
      throw new Error(erro.response?.data?.mensagem || 'Erro ao obter pacientes');
    }
  },

  async obterPacientePorId(id) {
    try {
      const resposta = await httpClient.get(`/pacientes/${id}`);
      return resposta.data;
    } catch (erro) {
      throw new Error(erro.response?.data?.mensagem || 'Erro ao obter paciente');
    }
  },

  async criarPaciente(dadosPaciente) {
    try {
      const resposta = await httpClient.post('/pacientes', dadosPaciente);
      return resposta.data;
    } catch (erro) {
      throw new Error(erro.response?.data?.mensagem || 'Erro ao criar paciente');
    }
  },

  async atualizarPaciente(id, dadosPaciente) {
    try {
      const resposta = await httpClient.put(`/pacientes/${id}`, dadosPaciente);
      return resposta.data;
    } catch (erro) {
      throw new Error(erro.response?.data?.mensagem || 'Erro ao atualizar paciente');
    }
  },

  async buscarPacientePorCPF(cpf) {
    try {
      const somenteDigitos = String(cpf || '').replace(/\D/g, '');
      if (!somenteDigitos || somenteDigitos.length < 11) {
        throw new Error('CPF inválido');
      }

      console.log('🔍 Buscando paciente por CPF (normalizado):', somenteDigitos);

      const rotasTentativas = [
        `/pacientes/buscar-cpf/${somenteDigitos}`,
        `/pacientes/buscar-por-cpf/${somenteDigitos}`,
        `/pacientes/cpf/${somenteDigitos}`,
        `/pacientes/buscar-cpf?cpf=${somenteDigitos}`,
        `/pacientes/buscar-por-cpf?cpf=${somenteDigitos}`,
      ];

      let ultimaRespostaOk = null;
      let ultimoErro = null;

      for (const rota of rotasTentativas) {
        try {
          console.log('➡️ Tentando rota:', rota);
          const resposta = await httpClient.get(rota);
          console.log('✅ Paciente encontrado na rota:', rota);
          ultimaRespostaOk = resposta?.data;
          break;
        } catch (erroTentativa) {
          const status = erroTentativa?.response?.status;
          console.log('⚠️ Falha na rota:', rota, '| status:', status);
          // Continuar tentando outras rotas em caso de 404/400
          ultimoErro = erroTentativa;
          continue;
        }
      }

      if (ultimaRespostaOk) {
        return ultimaRespostaOk;
      }

      // Se todas as rotas falharam
      throw ultimoErro || new Error('Paciente não encontrado');
    } catch (erro) {
      console.log('❌ Paciente não encontrado por CPF (todas as rotas):', cpf);
      const mensagem = erro?.response?.data?.mensagem || erro?.message || 'Paciente não encontrado';
      throw new Error(mensagem);
    }
  },

  // Alias para compatibilidade
  async buscarPorCpf(cpf) {
    return this.buscarPacientePorCPF(cpf);
  },
};

// Serviços de triagem
export const servicoTriagem = {
  async obterTriagens() {
    try {
      const resposta = await httpClient.get('/triagens');
      return resposta.data;
    } catch (erro) {
      throw new Error(erro.response?.data?.mensagem || 'Erro ao obter triagens');
    }
  },

  async obterTriagensAtivas(filtros = {}) {
    try {
      const resposta = await httpClient.get('/triagens-ativas', { params: filtros });
      return resposta.data;
    } catch (erro) {
      throw new Error(erro.response?.data?.mensagem || 'Erro ao obter triagens ativas');
    }
  },

  async obterHistoricoTriagensPaciente(pacienteId) {
    try {
      const resposta = await httpClient.get(`/pacientes/${pacienteId}/historico-triagens`);
      return resposta.data;
    } catch (erro) {
      throw new Error(erro.response?.data?.mensagem || 'Erro ao obter histórico de triagens');
    }
  },

  async obterTriagemPorId(id) {
    try {
      const resposta = await httpClient.get(`/triagens/${id}`);
      return resposta.data;
    } catch (erro) {
      throw new Error(erro.response?.data?.mensagem || 'Erro ao obter triagem');
    }
  },

  async criarTriagem(dadosTriagem) {
    try {
      const dadosFormatados = formatTriagemData(dadosTriagem);
      console.log('🔍 Enviando dados para /triagens:', JSON.stringify(dadosFormatados, null, 2));
      const resposta = await httpClient.post('/triagens', dadosFormatados);
      console.log('✅ Resposta da API:', resposta.data);
      return resposta.data;
    } catch (erro) {
      console.error('❌ Erro ao criar triagem:', erro.response?.data);
      console.error('❌ Status:', erro.response?.status);
      console.error('❌ Erros de validação:', erro.response?.data?.erros);
      throw new Error(erro.response?.data?.mensagem || 'Erro ao criar triagem');
    }
  },

  async atualizarTriagem(id, dadosTriagem) {
    try {
      const resposta = await httpClient.put(`/triagens/${id}`, dadosTriagem);
      return resposta.data;
    } catch (erro) {
      throw new Error(erro.response?.data?.mensagem || 'Erro ao atualizar triagem');
    }
  },

  async registrarReavaliacao(id, dadosReavaliacao) {
    try {
      const dadosFormatados = formatReavaliacaoData(dadosReavaliacao);
      console.log('🔍 Enviando dados de reavaliação para /triagens/' + id + '/reavaliacoes:', JSON.stringify(dadosFormatados, null, 2));
      const resposta = await httpClient.post(`/triagens/${String(id)}/reavaliacoes`, dadosFormatados);
      console.log('✅ Resposta da API de reavaliação:', resposta.data);
      return resposta.data;
    } catch (erro) {
      console.error('❌ Erro ao registrar reavaliação:', erro.response?.data);
      console.error('❌ Status:', erro.response?.status);
      console.error('❌ Erros de validação:', erro.response?.data?.erros);
      throw new Error(erro.response?.data?.mensagem || 'Erro ao registrar reavaliação');
    }
  },
  
  async concluirTriagem(id) {
    try {
      console.log('🔍 Concluindo triagem:', id);
      const resposta = await httpClient.put(`/triagens/${String(id)}/concluir`);
      console.log('✅ Triagem concluída:', resposta.data);
      return resposta.data;
    } catch (erro) {
      console.error('❌ Erro ao concluir triagem:', erro.response?.data || erro.message);
      throw new Error(erro.response?.data?.mensagem || 'Erro ao concluir triagem');
    }
  },
};

// Serviços de atendimentos médicos
export const servicoAtendimentos = {
  async listar(filtros = {}) {
    try {
      const resposta = await httpClient.get('/atendimentos-medicos', { params: filtros });
      return resposta.data;
    } catch (erro) {
      throw new Error(erro.response?.data?.mensagem || 'Erro ao listar atendimentos');
    }
  },

  async obterPorId(id) {
    try {
      const resposta = await httpClient.get(`/atendimentos-medicos/${id}`);
      return resposta.data;
    } catch (erro) {
      throw new Error(erro.response?.data?.mensagem || 'Erro ao obter atendimento');
    }
  },

  async criar(dadosAtendimento) {
    try {
      const dadosFormatados = formatAtendimentoData(dadosAtendimento);
      console.log('🔍 ServicoAtendimentos - Enviando dados para /atendimentos-medicos:', JSON.stringify(dadosFormatados, null, 2));
      const resposta = await httpClient.post('/atendimentos-medicos', dadosFormatados);
      console.log('✅ ServicoAtendimentos - Resposta da API:', resposta.data);
      return resposta.data;
    } catch (erro) {
      console.error('❌ ServicoAtendimentos - Erro ao criar atendimento:', erro.response?.data);
      console.error('❌ ServicoAtendimentos - Status:', erro.response?.status);
      console.error('❌ ServicoAtendimentos - Erros de validação:', erro.response?.data?.erros);
      throw new Error(erro.response?.data?.mensagem || 'Erro ao criar atendimento');
    }
  },

  async atualizar(id, dadosAtendimento) {
    try {
      const resposta = await httpClient.put(`/atendimentos-medicos/${id}`, dadosAtendimento);
      return resposta.data;
    } catch (erro) {
      throw new Error(erro.response?.data?.mensagem || 'Erro ao atualizar atendimento');
    }
  },

  async finalizar(id, dadosFinalizacao = {}) {
    try {
      console.log('🔍 ServicoAtendimentos - Finalizando atendimento:', { id, dadosFinalizacao });
      const resposta = await httpClient.put(`/atendimentos-medicos/${id}/finalizar`, dadosFinalizacao);
      console.log('✅ ServicoAtendimentos - Resposta da finalização:', resposta.data);
      return resposta.data;
    } catch (erro) {
      console.error('❌ ServicoAtendimentos - Erro ao finalizar:', erro.response?.data);
      console.error('❌ ServicoAtendimentos - Status:', erro.response?.status);
      throw new Error(erro.response?.data?.mensagem || 'Erro ao finalizar atendimento');
    }
  },

  async observar(id, encaminhamento) {
    try {
      console.log('🔍 ServicoAtendimentos - Enviando para observação:', { id, encaminhamento });
      const resposta = await httpClient.post(`/atendimentos-medicos/${id}/observar`, { 
        encaminhamento: encaminhamento 
      });
      console.log('✅ ServicoAtendimentos - Resposta da observação:', resposta.data);
      return resposta.data;
    } catch (erro) {
      console.error('❌ ServicoAtendimentos - Erro ao observar:', erro.response?.data);
      console.error('❌ ServicoAtendimentos - Status:', erro.response?.status);
      throw new Error(erro.response?.data?.mensagem || 'Erro ao observar atendimento');
    }
  },
};

// Serviços de SAE
export const servicoSAE = {
  async listar() {
    try {
      const resposta = await httpClient.get('/sae');
      return resposta.data;
    } catch (erro) {
      throw new Error(erro.response?.data?.mensagem || 'Erro ao listar SAE');
    }
  },

  async obterPorId(id) {
    try {
      const resposta = await httpClient.get(`/sae/${id}`);
      return resposta.data;
    } catch (erro) {
      throw new Error(erro.response?.data?.mensagem || 'Erro ao obter SAE');
    }
  },

  async criar(dadosSAE) {
    try {
      const dadosFormatados = formatSAEData(dadosSAE);
      console.log('🔍 ServicoSAE - Enviando dados para /sae:', JSON.stringify(dadosFormatados, null, 2));
      const resposta = await httpClient.post('/sae', dadosFormatados);
      console.log('✅ ServicoSAE - Resposta da API:', resposta.data);
      return resposta.data;
    } catch (erro) {
      console.error('❌ ServicoSAE - Erro ao criar SAE:', erro.response?.data);
      console.error('❌ ServicoSAE - Status:', erro.response?.status);
      console.error('❌ ServicoSAE - Erros de validação:', erro.response?.data?.erros);
      throw new Error(erro.response?.data?.mensagem || 'Erro ao criar SAE');
    }
  },

  async atualizar(id, dadosSAE) {
    try {
      const resposta = await httpClient.put(`/sae/${id}`, dadosSAE);
      return resposta.data;
    } catch (erro) {
      throw new Error(erro.response?.data?.mensagem || 'Erro ao atualizar SAE');
    }
  },
};

// Serviços de Parâmetros do Sistema
export const servicoParametrosSistema = {
  async obterParametros() {
    try {
      console.log('🔍 ServicoParametrosSistema - Buscando parâmetros do sistema...');
      const resposta = await httpClient.get('/sistema-parametros');
      console.log('✅ ServicoParametrosSistema - Parâmetros obtidos:', resposta.data);
      return resposta.data;
    } catch (erro) {
      console.error('❌ ServicoParametrosSistema - Erro ao obter parâmetros:', erro.response?.data);
      throw new Error(erro.response?.data?.mensagem || 'Erro ao obter parâmetros do sistema');
    }
  },

  async obterParametroPorCategoria(categoria) {
    try {
      console.log('🔍 ServicoParametrosSistema - Buscando parâmetro para categoria:', categoria);
      const resposta = await httpClient.get(`/sistema-parametros/${categoria}`);
      console.log('✅ ServicoParametrosSistema - Parâmetro obtido:', resposta.data);
      return resposta.data;
    } catch (erro) {
      console.error('❌ ServicoParametrosSistema - Erro ao obter parâmetro:', erro.response?.data);
      throw new Error(erro.response?.data?.mensagem || 'Erro ao obter parâmetro do sistema');
    }
  },
};

// Serviços de Diagnósticos CIPE (catálogo gerenciado no backend)
export const servicoDiagnosticosCipe = {
  async listar({ apenasAtivos = true } = {}) {
    try {
      const params = apenasAtivos ? { ativos: true } : {};
      const resposta = await httpClient.get('/diagnosticos-cipe', { params });
      return resposta.data;
    } catch (erro) {
      throw new Error(erro.response?.data?.mensagem || 'Erro ao listar diagnósticos CIPE');
    }
  },
};

// Serviços de Intervenções CIPE (catálogo)
export const servicoIntervencoesCipe = {
  async listar({ apenasAtivos = true } = {}) {
    try {
      const params = apenasAtivos ? { ativos: true } : {};
      const resposta = await httpClient.get('/intervencoes-cipe', { params });
      return resposta.data;
    } catch (erro) {
      throw new Error(erro.response?.data?.mensagem || 'Erro ao listar intervenções CIPE');
    }
  },
};

// Serviços de Resultados NOC (catálogo)
export const servicoResultadosNoc = {
  async listar({ apenasAtivos = true } = {}) {
    try {
      const params = apenasAtivos ? { ativos: true } : {};
      const resposta = await httpClient.get('/resultados-noc', { params });
      return resposta.data;
    } catch (erro) {
      throw new Error(erro.response?.data?.mensagem || 'Erro ao listar resultados NOC');
    }
  },
};

// Serviços de Templates de Evolução
export const servicoTemplatesEvolucao = {
  async listar({ apenasAtivos = true } = {}) {
    try {
      const params = apenasAtivos ? { ativos: true } : {};
      const resposta = await httpClient.get('/templates-evolucao', { params });
      return resposta.data;
    } catch (erro) {
      throw new Error(erro.response?.data?.mensagem || 'Erro ao listar templates de evolução');
    }
  },
};

export default httpClient;