import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { usarConfiguracaoReavaliacao } from './ContextoConfiguracaoReavaliacao';
import { pacientesService } from '../services/pacientes.service';
import { triagemService } from '../services/triagem.service';
import { atendimentosService } from '../services/atendimentos.service';
import { saeService } from '../services/sae.service';

// Estado inicial
const estadoInicial = {
  pacientesTriados: [],
  pacienteAtual: null,
  pacientes: [],
  triagens: [],
  carregando: false,
  erro: null,
  carregandoPacientes: false,
};

// Tipos de ações
const AcoesPaciente = {
  ADICIONAR_PACIENTE_TRIADO: 'ADICIONAR_PACIENTE_TRIADO',
  ATUALIZAR_PACIENTE: 'ATUALIZAR_PACIENTE',
  REMOVER_PACIENTE: 'REMOVER_PACIENTE',
  DEFINIR_PACIENTE_ATUAL: 'DEFINIR_PACIENTE_ATUAL',
  LIMPAR_PACIENTE_ATUAL: 'LIMPAR_PACIENTE_ATUAL',
  LIMPAR_ALERTAS_REAVALIACAO: 'LIMPAR_ALERTAS_REAVALIACAO',
  CARREGAR_PACIENTES: 'CARREGAR_PACIENTES',
  CARREGAR_TRIAGENS: 'CARREGAR_TRIAGENS',
  DEFINIR_CARREGANDO_PACIENTES: 'DEFINIR_CARREGANDO_PACIENTES',
  DEFINIR_CARREGANDO: 'DEFINIR_CARREGANDO',
  DEFINIR_ERRO: 'DEFINIR_ERRO',
};

// Função para gerar ID da etiqueta
const gerarIdEtiqueta = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `MT${timestamp}${random}`;
};

// Reducer para gerenciar o estado
const reducerPaciente = (estado, acao) => {
  switch (acao.tipo) {
    case AcoesPaciente.ADICIONAR_PACIENTE_TRIADO:
      const novoPaciente = {
        ...acao.payload,
        id: acao.payload?.id ?? Date.now().toString(),
        idEtiqueta: acao.payload?.idEtiqueta ?? gerarIdEtiqueta(),
        dataTriagem: acao.payload?.dataTriagem ?? new Date().toISOString(),
        status: acao.payload?.status ?? 'triado',
      };
      return {
        ...estado,
        pacientesTriados: [...estado.pacientesTriados, novoPaciente],
        pacienteAtual: null,
      };

    case AcoesPaciente.ATUALIZAR_PACIENTE:
      console.log('🔄 ContextoPaciente - Atualizando paciente:', acao.payload.id, acao.payload);
      const pacientesAtualizados = estado.pacientesTriados.map(paciente =>
        paciente.id === acao.payload.id ? { 
          ...paciente, 
          ...acao.payload,
          ultimaReavaliacao: acao.payload.ultimaReavaliacao ? new Date().toISOString() : paciente.ultimaReavaliacao,
          contadorReavaliacao: acao.payload.contadorReavaliacao || paciente.contadorReavaliacao,
        } : paciente
      );
      console.log('✅ ContextoPaciente - Paciente atualizado:', pacientesAtualizados.find(p => p.id === acao.payload.id));
      return {
        ...estado,
        pacientesTriados: pacientesAtualizados,
      };

    case AcoesPaciente.REMOVER_PACIENTE:
      return {
        ...estado,
        pacientesTriados: estado.pacientesTriados.filter(paciente => paciente.id !== acao.payload),
      };

    case AcoesPaciente.DEFINIR_PACIENTE_ATUAL:
      return {
        ...estado,
        pacienteAtual: acao.payload,
      };

    case AcoesPaciente.LIMPAR_PACIENTE_ATUAL:
      return {
        ...estado,
        pacienteAtual: null,
      };

    case AcoesPaciente.LIMPAR_ALERTAS_REAVALIACAO:
      console.log('🔄 Limpando alertas de reavaliação para paciente:', acao.payload);
      return {
        ...estado,
        pacientesTriados: estado.pacientesTriados.map(paciente => {
          if (paciente.id === acao.payload) {
            console.log('✅ Atualizando paciente:', paciente.nome, 'com nova reavaliação');
            return {
              ...paciente,
              ultimaReavaliacao: new Date().toISOString(),
              contadorReavaliacao: 0,
            };
          }
          return paciente;
        }),
      };

    case AcoesPaciente.CARREGAR_PACIENTES:
      return {
        ...estado,
        pacientes: acao.payload,
        carregando: false,
        carregandoPacientes: false,
        erro: null,
      };

    case AcoesPaciente.DEFINIR_CARREGANDO_PACIENTES:
      return {
        ...estado,
        carregandoPacientes: acao.payload,
      };

    case AcoesPaciente.CARREGAR_TRIAGENS: {
      const mapaRisco = {
        VERMELHO: 'red',
        LARANJA: 'orange',
        AMARELO: 'yellow',
        VERDE: 'green',
        AZUL: 'blue',
      };
      
      const triagensArr = Array.isArray(acao.payload?.triagens) ? acao.payload.triagens : (Array.isArray(acao.payload) ? acao.payload : []);
      const atendimentosArr = Array.isArray(acao.payload?.atendimentos) ? acao.payload.atendimentos : [];
      const saeArr = Array.isArray(acao.payload?.sae) ? acao.payload.sae : [];

      const pacientesMapeados = triagensArr.map((triagem) => {
        const dadosClinicos = triagem?.dados_clinicos || {};
        
        // Log para verificar campos de reavaliação
        if (triagem?.ultima_reavaliacao) {
          console.log('🔍 Triagem com reavaliação:', {
            id: triagem.id,
            ultima_reavaliacao: triagem.ultima_reavaliacao,
            reavaliacoes_count: triagem.reavaliacoes_count,
            classificacao_risco: triagem.classificacao_risco,
            dados_clinicos: triagem.dados_clinicos
          });
        }
        
        // Log para debug da estrutura dos dados clínicos (apenas se necessário)
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Dados clínicos da triagem:', {
            id: triagem.id,
            dadosClinicos: dadosClinicos,
            camposDisponiveis: Object.keys(dadosClinicos || {}),
            pressao_arterial: dadosClinicos?.pressao_arterial,
            frequencia_cardiaca: dadosClinicos?.frequencia_cardiaca,
            temperatura: dadosClinicos?.temperatura
          });
          
          // Log para debug dos dados do paciente
          console.log('🔍 Dados do paciente na triagem:', {
            id: triagem.id,
            paciente: triagem.paciente,
            paciente_campos: triagem.paciente ? Object.keys(triagem.paciente) : 'Nenhum paciente',
            nome_completo: triagem.paciente?.nome_completo,
            nome: triagem.paciente?.nome,
            cpf: triagem.paciente?.cpf,
            data_nascimento: triagem.paciente?.data_nascimento
          });
        }
        
        // Buscar SAE associadas a esta triagem específica
        const registrosSAE = saeArr.filter(sae => 
          sae.triagem_id === triagem?.id
        );
        
        // Log para debug
        if (registrosSAE.length > 0) {
          console.log('🔍 SAE encontrada para triagem:', {
            triagem_id: triagem?.id,
            paciente: triagem?.paciente?.nome_completo || triagem?.paciente?.nome,
            sae_count: registrosSAE.length,
            sae_ids: registrosSAE.map(s => s.id)
          });
        }
        
        const pacienteMapeado = {
          id: triagem?.id ?? triagem?.triage_id ?? Date.now().toString(),
          idTriagem: triagem?.id, // ID específico da triagem para vinculações
          nome: triagem?.paciente?.nome_completo || triagem?.paciente?.nome || triagem?.nome_paciente || 'Paciente',
          cpf: triagem?.paciente?.cpf || triagem?.cpf || '',
          idEtiqueta: triagem?.protocolo || triagem?.tag || gerarIdEtiqueta(),
          dataTriagem: triagem?.data_triagem || triagem?.created_at || new Date().toISOString(),
          categoriaRisco: mapaRisco[String(triagem?.classificacao_risco || '').toUpperCase()] || 'blue',
          idPaciente: triagem?.paciente?.id,
          patientId: triagem?.paciente?.id, // Adicionado para compatibilidade
          dataNascimento: triagem?.paciente?.data_nascimento || '',
          sexo: triagem?.paciente?.sexo || '',
          enfermeiroTriagem: triagem?.usuario?.name || triagem?.usuario?.nome || 'Enfermeiro Responsável',
          // Sinais vitais e dados clínicos
          pressaoArterial: dadosClinicos?.pressao_arterial ?? '',
          frequenciaCardiaca: dadosClinicos?.frequencia_cardiaca ?? '',
          temperatura: dadosClinicos?.temperatura ?? '',
          frequenciaRespiratoria: dadosClinicos?.frequencia_respiratoria ?? '',
          saturacaoOxigenio: dadosClinicos?.saturacao_oxigenio ?? '',
          peso: dadosClinicos?.peso ?? '',
          altura: dadosClinicos?.altura ?? '',
          sintomas: dadosClinicos?.sintomas ?? '',
          historicoMedico: dadosClinicos?.historico_medico ?? '',
          ultimaReavaliacao: triagem?.ultima_reavaliacao || null,
          avaliacaoSeguranca: triagem?.avaliacao_seguranca || {},
          registrosSAE: registrosSAE,
          status: (() => {
            const statusRaw = String(triagem?.status || triagem?.situacao || '').toUpperCase();
            if (!statusRaw) return 'triado';
            if (statusRaw === 'CONCLUIDA') return 'finalizado';
            if (statusRaw === 'EM_ANDAMENTO') return 'triado'; // Triagem em andamento = triado
            if (statusRaw === 'FINALIZADO') return 'finalizado';
            if (statusRaw === 'OBSERVACAO') return 'observacao';
            if (statusRaw === 'EM_ATENDIMENTO') return 'atendimento';
            return 'triado';
          })(),
          // Verificar se precisa de reavaliação
          precisaReavaliar: (() => {
            // Ignorar completamente reavaliação para pacientes em observação
            const statusTriagemRaw = String(triagem?.status || triagem?.situacao || '').toUpperCase();
            if (statusTriagemRaw === 'OBSERVACAO') {
              return false;
            }

            const agora = new Date();
            const dataTriagemObj = new Date(triagem?.data_triagem || triagem?.created_at);
            const tempoDecorrido = agora - dataTriagemObj;
            
            // Tempos de reavaliação por categoria (em minutos) vindos do backend, com fallback
            const temposReavaliacao = acao.payload?.temposReavaliacao || {
              red: 15,
              orange: 30,
              yellow: 60,
              green: 120,
              blue: 240
            };
            
            const categoriaRisco = triagem?.classificacao_risco?.toLowerCase() || 'blue';
            const tempoReavaliacao = temposReavaliacao[categoriaRisco] || 60;
            const tempoReavaliacaoMs = tempoReavaliacao * 60 * 1000;
            
            // Log para debug
            console.log('🔍 Verificação de reavaliação:', {
              paciente: triagem?.paciente?.nome_completo || triagem?.paciente?.nome,
              triagem_id: triagem?.id,
              categoriaRisco,
              tempoReavaliacao,
              tempoDecorrido: Math.round(tempoDecorrido / (60 * 1000)),
              ultimaReavaliacao: triagem?.ultima_reavaliacao
            });
            
            // Se há uma reavaliação recente, só considerar vencida quando ultrapassar o tempo configurado
            if (triagem?.ultima_reavaliacao) {
              const ultimaReavaliacaoObj = new Date(triagem.ultima_reavaliacao);
              const tempoDesdeReavaliacao = agora - ultimaReavaliacaoObj;
              if (tempoDesdeReavaliacao < tempoReavaliacaoMs) {
                console.log('🔍 Reavaliação dentro do tempo configurado, não precisa reavaliar');
                return false;
              }
              
              // Se passou do tempo configurado desde a última reavaliação, verificar novamente
              const precisaReavaliar = tempoDesdeReavaliacao >= tempoReavaliacaoMs;
              console.log('🔍 Resultado da verificação com última reavaliação:', { 
                precisaReavaliar, 
                tempoDesdeReavaliacao: Math.round(tempoDesdeReavaliacao / (60 * 1000)),
                tempoReavaliacaoMs: Math.round(tempoReavaliacaoMs / (60 * 1000))
              });
              return precisaReavaliar;
            }
            
            // Se não há reavaliação, verificar se precisa reavaliar baseado na data da triagem
            const precisaReavaliar = tempoDecorrido >= tempoReavaliacaoMs;
            console.log('🔍 Resultado da verificação sem última reavaliação:', { 
              precisaReavaliar, 
              tempoDecorrido: Math.round(tempoDecorrido / (60 * 1000)),
              tempoReavaliacaoMs: Math.round(tempoReavaliacaoMs / (60 * 1000))
            });
            return precisaReavaliar;
          })(),
        };
        
        // Log para debug dos dados mapeados (apenas se necessário)
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Paciente mapeado:', {
            id: pacienteMapeado.id,
            nome: pacienteMapeado.nome,
            cpf: pacienteMapeado.cpf,
            categoriaRisco: pacienteMapeado.categoriaRisco,
            pressaoArterial: pacienteMapeado.pressaoArterial,
            frequenciaCardiaca: pacienteMapeado.frequenciaCardiaca,
            temperatura: pacienteMapeado.temperatura,
            sintomas: pacienteMapeado.sintomas,
            dataNascimento: pacienteMapeado.dataNascimento,
            sexo: pacienteMapeado.sexo
          });
        }
        
        return pacienteMapeado;
      });

      // Marcar status baseado nos atendimentos da triagem
      const pacientesComStatusAtualizado = pacientesMapeados.map((paciente) => {
        // Buscar atendimentos desta triagem específica
        const atendimentosTriagem = atendimentosArr.filter((atendimento) => 
          atendimento?.triagem_id === paciente?.idTriagem
        );
        
        if (atendimentosTriagem.length > 0) {
          // Pegar o atendimento mais recente
          const atendimentoMaisRecente = atendimentosTriagem.reduce((maisRecente, atual) => 
            atual.id > maisRecente.id ? atual : maisRecente
          );
          
          // Atualizar status baseado no atendimento mais recente
          let novoStatus = paciente.status;
          if (atendimentoMaisRecente.status === 'OBSERVACAO') {
            novoStatus = 'observacao';
          } else if (atendimentoMaisRecente.status === 'EM_ATENDIMENTO') {
            novoStatus = 'atendimento';
          } else if (atendimentoMaisRecente.status === 'FINALIZADO') {
            novoStatus = 'finalizado';
          }
          
          // Se precisa de reavaliação e não está em atendimento/observação/finalizado, alterar status
          if (paciente.precisaReavaliar && !['observacao','atendimento','finalizado'].includes(novoStatus)) {
            console.log('🔍 Alterando status para aguardando_reavaliacao:', {
              paciente: paciente.nome,
              status_anterior: novoStatus,
              precisaReavaliar: paciente.precisaReavaliar,
              categoriaRisco: paciente.categoriaRisco,
              dataTriagem: paciente.dataTriagem,
              ultimaReavaliacao: paciente.ultimaReavaliacao
            });
            novoStatus = 'aguardando_reavaliacao';
          }
          
          // Log para debug
          console.log('🔍 Status atualizado para paciente:', {
            paciente: paciente.nome,
            triagem_id: paciente.idTriagem,
            status_anterior: paciente.status,
            status_novo: novoStatus,
            atendimento_status: atendimentoMaisRecente.status,
            atendimento_id: atendimentoMaisRecente.id
          });
          
          return {
            ...paciente,
            status: novoStatus,
            inicioObservacao: atendimentoMaisRecente?.inicio_observacao || paciente.inicioObservacao,
            idAtendimento: atendimentoMaisRecente?.id,
            observacaoMedica: atendimentoMaisRecente?.conduta || null,
            medicoResponsavel: atendimentoMaisRecente?.medico?.nome || null,
          };
        }
        
        // Se não há atendimentos, verificar se precisa de reavaliação (exceto observação/atendimento/finalizado)
        if (paciente.precisaReavaliar && !['observacao','atendimento','finalizado'].includes(paciente.status)) {
          console.log('🔍 Paciente sem atendimentos - Alterando status para aguardando_reavaliacao:', {
            paciente: paciente.nome,
            status_anterior: paciente.status,
            precisaReavaliar: paciente.precisaReavaliar,
            categoriaRisco: paciente.categoriaRisco,
            dataTriagem: paciente.dataTriagem,
            ultimaReavaliacao: paciente.ultimaReavaliacao
          });
          return {
            ...paciente,
            status: 'aguardando_reavaliacao'
          };
        }
        
        return paciente;
      });

      // Filtrar pacientes ativos
      const pacientesAtivos = pacientesComStatusAtualizado.filter((paciente) => {
        if (paciente.status === 'finalizado') return false;
        
        const atendimentoFinalizado = atendimentosArr.find((atendimento) => 
          atendimento?.triagem_id === paciente?.idTriagem && 
          atendimento?.status === 'FINALIZADO'
        );
        
        if (atendimentoFinalizado) return false;
        
        if (paciente.status === 'observacao') {
          const atendimentoAtivo = atendimentosArr.find((atendimento) => 
            atendimento?.triagem_id === paciente?.idTriagem && 
            atendimento?.status === 'OBSERVACAO' &&
            !atendimento?.fim_observacao
          );
          
          if (!atendimentoAtivo) return false;
        }
        
        // Incluir pacientes aguardando reavaliação
        if (paciente.status === 'aguardando_reavaliacao') return true;
        
        return true;
      });

      // Ordenar pacientes por classificação de risco > hora da triagem
      const pacientesOrdenados = pacientesAtivos.sort((a, b) => {
        const prioridadeRisco = {
          'red': 1,     // VERMELHO - Prioridade máxima
          'orange': 2,  // LARANJA - Segunda prioridade
          'yellow': 3,  // AMARELO - Terceira prioridade
          'green': 4,   // VERDE - Quarta prioridade
          'blue': 5     // AZUL - Prioridade mínima
        };
        
        // Comparar por classificação de risco primeiro (sempre)
        const prioridadeA = prioridadeRisco[a.categoriaRisco] || 6;
        const prioridadeB = prioridadeRisco[b.categoriaRisco] || 6;
        
        if (prioridadeA !== prioridadeB) {
          return prioridadeA - prioridadeB; // Menor número = maior prioridade
        }
        
        // Desempate: Hora da triagem (mais antigo primeiro)
        const dataA = new Date(a.dataTriagem);
        const dataB = new Date(b.dataTriagem);
        return dataA - dataB; // Mais antigo primeiro
      });

      return {
        ...estado,
        triagens: triagensArr,
        pacientesTriados: pacientesOrdenados,
        carregando: false,
        erro: null,
      };
    }

    case AcoesPaciente.DEFINIR_CARREGANDO:
      return {
        ...estado,
        carregando: acao.payload,
      };

    case AcoesPaciente.DEFINIR_ERRO:
      return {
        ...estado,
        erro: acao.payload,
        carregando: false,
      };

    default:
      return estado;
  }
};

// Context
const ContextoPaciente = createContext();

// Provider
export const ProvedorPaciente = ({ children }) => {
  const [estado, dispatch] = useReducer(reducerPaciente, estadoInicial);
  const { obterTemposReavaliacao } = usarConfiguracaoReavaliacao();

  const adicionarPacienteTriado = (dadosPaciente) => {
    dispatch({
      tipo: AcoesPaciente.ADICIONAR_PACIENTE_TRIADO,
      payload: dadosPaciente,
    });
  };

  const atualizarPaciente = (idPaciente, atualizacoes) => {
    dispatch({
      tipo: AcoesPaciente.ATUALIZAR_PACIENTE,
      payload: { id: idPaciente, ...atualizacoes },
    });
  };

  const removerPaciente = (idPaciente) => {
    dispatch({
      tipo: AcoesPaciente.REMOVER_PACIENTE,
      payload: idPaciente,
    });
  };

  const definirPacienteAtual = (dadosPaciente) => {
    dispatch({
      tipo: AcoesPaciente.DEFINIR_PACIENTE_ATUAL,
      payload: dadosPaciente,
    });
  };

  const limparPacienteAtual = () => {
    dispatch({
      tipo: AcoesPaciente.LIMPAR_PACIENTE_ATUAL,
    });
  };

  const obterPacientesTriados = () => {
    return estado.pacientesTriados || [];
  };

  const obterEstatisticasPacientes = () => {
    const pacientes = estado.pacientesTriados || [];
    const pacientesAtivos = pacientes.filter(p => p.status !== 'finalizado' && !p.tempoAlta);
    
    return {
      triados: pacientesAtivos.filter(p => p.status === 'triado' || p.status === 'aguardando_reavaliacao').length,
      aguardando: pacientesAtivos.filter(p => p.status === 'aguardando').length,
      atendimento: pacientesAtivos.filter(p => p.status === 'atendimento').length,
      procedimento: pacientesAtivos.filter(p => p.status === 'procedimento' || p.status === 'observacao').length,
    };
  };

  const obterPacientePorId = (idPaciente) => {
    return estado.pacientesTriados.find(paciente => paciente.id === idPaciente);
  };

  const limparAlertasReavaliacao = (idPaciente) => {
    dispatch({
      tipo: AcoesPaciente.LIMPAR_ALERTAS_REAVALIACAO,
      payload: idPaciente,
    });
  };

  // Funções para carregar dados da API
  const carregarPacientes = useCallback(async () => {
    // Evitar múltiplas chamadas simultâneas
    if (estado.carregandoPacientes) {
      console.log('⚠️ ContextoPaciente - Carregamento já em andamento, ignorando...');
      return;
    }

    try {
      console.log('🔄 ContextoPaciente - Carregando pacientes...');
      dispatch({ tipo: AcoesPaciente.DEFINIR_CARREGANDO_PACIENTES, payload: true });
      dispatch({ tipo: AcoesPaciente.DEFINIR_CARREGANDO, payload: true });
      
      const resposta = await pacientesService.obterPacientes();
      console.log('📋 ContextoPaciente - Resposta da API:', resposta);
      console.log('📋 ContextoPaciente - Dados dos pacientes:', resposta.dados?.data);
      
      dispatch({ tipo: AcoesPaciente.CARREGAR_PACIENTES, payload: resposta.dados?.data || [] });
    } catch (erro) {
      console.error('❌ ContextoPaciente - Erro ao carregar pacientes:', erro);
      dispatch({ tipo: AcoesPaciente.DEFINIR_ERRO, payload: erro.message });
      dispatch({ tipo: AcoesPaciente.DEFINIR_CARREGANDO_PACIENTES, payload: false });
    }
  }, [estado.carregandoPacientes]);

  const carregarTriagens = useCallback(async () => {
    try {
      console.log('🔄 Iniciando carregamento de triagens...');
      dispatch({ tipo: AcoesPaciente.DEFINIR_CARREGANDO, payload: true });
      const [respostaTriagens, respostaAtendimentos] = await Promise.all([
        triagemService.obterTriagensAtivas(),
        atendimentosService.listar(), // Buscar todos os atendimentos para verificar status
      ]);
      
      // Buscar SAE apenas das triagens ativas
      const triagensAtivas = respostaTriagens?.dados?.data || [];
      const triagemIds = triagensAtivas.map(t => t.id);
      
      let respostaSAE = { dados: { data: [] } };
      if (triagemIds.length > 0) {
        // Buscar SAE para cada triagem ativa
        const saePromises = triagemIds.map(triagemId => 
          saeService.listar({ triagem_id: triagemId })
        );
        const saeResults = await Promise.all(saePromises);
        
        // Consolidar todos os resultados SAE
        const todasSAE = saeResults.flatMap(result => result?.dados?.data || []);
        respostaSAE = { dados: { data: todasSAE } };
        
        // Log para debug
        console.log('📊 SAE consolidadas:', {
          total_sae: todasSAE.length,
          triagens_consultadas: triagemIds.length,
          sae_por_triagem: todasSAE.map(s => ({ id: s.id, triagem_id: s.triagem_id }))
        });
      }
      
      console.log('📊 Dados recebidos:', {
        triagens: respostaTriagens?.dados?.data?.length || 0,
        atendimentos: respostaAtendimentos?.dados?.data?.length || 0,
        sae: respostaSAE?.dados?.data?.length || 0
      });
      
      const dadosTriagens = respostaTriagens?.dados?.data || [];
      const dadosAtendimentos = respostaAtendimentos?.dados?.data || [];
      const dadosSAE = respostaSAE?.dados?.data || [];
      
      // Log para debug dos dados recebidos
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Dados recebidos do backend:');
        console.log('  Triagens:', dadosTriagens.length, 'itens');
        console.log('  Atendimentos:', dadosAtendimentos.length, 'itens');
        console.log('  SAE:', dadosSAE.length, 'itens');
        
        // Mostrar status das triagens
        const statusTriagens = dadosTriagens.map(t => ({ id: t.id, status: t.status }));
        console.log('  Status das triagens:', statusTriagens);
        
        // Mostrar status dos atendimentos
        const statusAtendimentos = dadosAtendimentos.map(a => ({ id: a.id, status: a.status, triagem_id: a.triagem_id }));
        console.log('  Status dos atendimentos:', statusAtendimentos);
      }
      
      // Log para debug da estrutura dos dados do backend (apenas se necessário)
      if (process.env.NODE_ENV === 'development') {
        if (dadosTriagens.length > 0) {
          console.log('🔍 Estrutura dos dados de triagem do backend:', {
            primeiraTriagem: dadosTriagens[0],
            camposDisponiveis: Object.keys(dadosTriagens[0] || {}),
            dadosClinicos: dadosTriagens[0]?.dados_clinicos,
            paciente: dadosTriagens[0]?.paciente,
            paciente_campos: dadosTriagens[0]?.paciente ? Object.keys(dadosTriagens[0].paciente) : 'Nenhum paciente',
            classificacao_risco: dadosTriagens[0]?.classificacao_risco,
            status: dadosTriagens[0]?.status
          });
        }
        
        // Log para debug da estrutura dos dados de SAE
        if (dadosSAE.length > 0) {
          console.log('🔍 Estrutura dos dados de SAE do backend:', {
            primeiraSAE: dadosSAE[0],
            camposDisponiveis: Object.keys(dadosSAE[0] || {}),
            paciente_id: dadosSAE[0]?.paciente_id,
            triagem_id: dadosSAE[0]?.triagem_id
          });
        }
      }
      
      const atendimentosAtivos = dadosAtendimentos.filter(atendimento => 
        atendimento.status === 'OBSERVACAO' && 
        !atendimento.fim_observacao
      );
      
      const payload = { 
        triagens: dadosTriagens, 
        atendimentos: atendimentosAtivos, 
        sae: dadosSAE,
        temposReavaliacao: obterTemposReavaliacao()
      };
      dispatch({ tipo: AcoesPaciente.CARREGAR_TRIAGENS, payload });
      console.log('✅ Triagens carregadas com sucesso');
    } catch (erro) {
      console.error('❌ Erro ao carregar triagens:', erro);
      dispatch({ tipo: AcoesPaciente.DEFINIR_ERRO, payload: erro.message });
    } finally {
      dispatch({ tipo: AcoesPaciente.DEFINIR_CARREGANDO, payload: false });
    }
  }, [dispatch, obterTemposReavaliacao]);

  const criarPaciente = async (dadosPaciente) => {
    try {
      dispatch({ tipo: AcoesPaciente.DEFINIR_CARREGANDO, payload: true });
      const resposta = await pacientesService.criarPaciente(dadosPaciente);
      await carregarPacientes();
      return resposta;
    } catch (erro) {
      dispatch({ tipo: AcoesPaciente.DEFINIR_ERRO, payload: erro.message });
      throw erro;
    }
  };

  const criarTriagem = async (dadosTriagem) => {
    try {
      dispatch({ tipo: AcoesPaciente.DEFINIR_CARREGANDO, payload: true });
      const resposta = await triagemService.criarTriagem(dadosTriagem);
      await carregarTriagens();
      return resposta;
    } catch (erro) {
      dispatch({ tipo: AcoesPaciente.DEFINIR_ERRO, payload: erro.message });
      throw erro;
    }
  };

  const obterPacientes = () => {
    return estado.pacientes || [];
  };

  const valor = {
    ...estado,
    adicionarPacienteTriado,
    atualizarPaciente,
    removerPaciente,
    definirPacienteAtual,
    limparPacienteAtual,
    obterPacientesTriados,
    obterPacientes,
    obterEstatisticasPacientes,
    obterPacientePorId,
    limparAlertasReavaliacao,
    carregarPacientes,
    carregarTriagens,
    criarPaciente,
    criarTriagem,
  };

  return (
    <ContextoPaciente.Provider value={valor}>
      {children}
    </ContextoPaciente.Provider>
  );
};

// Hook para usar o contexto
export const usarPaciente = () => {
  const contexto = useContext(ContextoPaciente);
  if (!contexto) {
    throw new Error('usarPaciente deve ser usado dentro de um ProvedorPaciente');
  }
  return contexto;
};

export default ContextoPaciente;