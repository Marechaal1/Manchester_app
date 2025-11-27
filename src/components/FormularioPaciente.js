import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { estilosComuns } from '../styles/designSystem';
import { applyDateMask, formatDateToDDMMYYYY, formatDateToISO, parseDateFromDDMMYYYY, isValidDate } from '../utils/dateUtils';

const FormularioPaciente = ({ 
  paciente, 
  onSave, 
  onCancel, 
  carregando = false,
  modoEdicao = false 
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    dataNascimento: '',
    sexo: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    observacoes: '',
  });

  const [erros, setErros] = useState({});

  // Preencher formulário quando paciente for fornecido
  useEffect(() => {
    if (paciente) {
      setFormData({
        nome: paciente.nome || paciente.nome_completo || '',
        cpf: paciente.cpf || '',
        dataNascimento: formatDateToDDMMYYYY(paciente.dataNascimento || paciente.data_nascimento),
        sexo: paciente.sexo || '',
        telefone: formatarTelefone(paciente.telefone || ''),
        endereco: paciente.endereco || '',
        cidade: paciente.cidade || '',
        estado: paciente.estado || '',
        cep: paciente.cep || '',
        observacoes: paciente.observacoes || '',
      });
    }
  }, [paciente]);

  // Validar formulário
  const validarFormulario = () => {
    const novosErros = {};

    if (!formData.nome.trim()) {
      novosErros.nome = 'Nome é obrigatório';
    }

    if (!formData.cpf.trim()) {
      novosErros.cpf = 'CPF é obrigatório';
    } else if (!validarCPF(formData.cpf)) {
      novosErros.cpf = 'CPF inválido';
    }

    if (!formData.dataNascimento) {
      novosErros.dataNascimento = 'Data de nascimento é obrigatória';
    } else if (!isValidDate(formData.dataNascimento)) {
      novosErros.dataNascimento = 'Data de nascimento inválida';
    }

    if (!formData.sexo) {
      novosErros.sexo = 'Sexo é obrigatório';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Validar CPF
  const validarCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]/g, '');
    if (cpf.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validar dígitos verificadores
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  };

  // Formatar CPF
  const formatarCPF = (texto) => {
    const numeros = texto.replace(/[^\d]/g, '');
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Formatar CEP
  const formatarCEP = (texto) => {
    const numeros = texto.replace(/[^\d]/g, '');
    return numeros.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  // Formatar telefone
  const formatarTelefone = (texto) => {
    const numeros = texto.replace(/[^\d]/g, '').slice(0, 11);
    if (numeros.length === 0) return '';
    if (numeros.length < 3) return `(${numeros}`;
    if (numeros.length <= 6) return `(${numeros.slice(0,2)}) ${numeros.slice(2)}`;
    if (numeros.length <= 10) return `(${numeros.slice(0,2)}) ${numeros.slice(2,6)}-${numeros.slice(6)}`;
    return `(${numeros.slice(0,2)}) ${numeros.slice(2,7)}-${numeros.slice(7,11)}`;
  };

  // Atualizar campo
  const atualizarCampo = (campo, valor) => {
    let valorFormatado = valor;
    
    switch (campo) {
      case 'cpf':
        valorFormatado = formatarCPF(valor);
        break;
      case 'cep':
        valorFormatado = formatarCEP(valor);
        break;
      case 'telefone':
        valorFormatado = formatarTelefone(valor);
        break;
      case 'estado':
        valorFormatado = String(valor || '').toUpperCase().slice(0, 2);
        break;
    }
    
    setFormData(prev => ({ ...prev, [campo]: valorFormatado }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (erros[campo]) {
      setErros(prev => ({ ...prev, [campo]: null }));
    }
  };

  // Salvar
  const handleSave = () => {
    if (validarFormulario()) {
      // Converter data de DD/MM/YYYY para ISO (YYYY-MM-DD) antes de salvar
      const dataToSave = {
        // Mapear para os nomes esperados pelo backend
        nome_completo: formData.nome,
        cpf: formData.cpf,
        data_nascimento: parseDateFromDDMMYYYY(formData.dataNascimento)?.toISOString().split('T')[0] || formData.dataNascimento,
        sexo: formData.sexo,
        telefone: formData.telefone,
        endereco: formData.endereco,
        cidade: formData.cidade,
        estado: String(formData.estado || '').toUpperCase(),
        cep: formData.cep,
        observacoes: formData.observacoes,
      };
      onSave(dataToSave);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
        {/* Nome */}
        <View style={styles.campo}>
          <Text style={styles.label}>Nome Completo *</Text>
          <TextInput
            style={[styles.input, erros.nome && styles.inputErro]}
            value={formData.nome}
            onChangeText={(valor) => atualizarCampo('nome', valor)}
            placeholder="Digite o nome completo"
            placeholderTextColor="#999"
          />
          {erros.nome && <Text style={styles.erro}>{erros.nome}</Text>}
        </View>

        {/* CPF */}
        <View style={styles.campo}>
          <Text style={styles.label}>CPF *</Text>
          <TextInput
            style={[styles.input, erros.cpf && styles.inputErro]}
            value={formData.cpf}
            onChangeText={(valor) => atualizarCampo('cpf', valor)}
            placeholder="000.000.000-00"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={14}
          />
          {erros.cpf && <Text style={styles.erro}>{erros.cpf}</Text>}
        </View>

        {/* Data de Nascimento */}
        <View style={styles.campo}>
          <Text style={styles.label}>Data de Nascimento *</Text>
          <TextInput
            style={[styles.input, erros.dataNascimento && styles.inputErro]}
            value={formData.dataNascimento}
            onChangeText={(valor) => atualizarCampo('dataNascimento', applyDateMask(valor))}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={10}
          />
          {erros.dataNascimento && <Text style={styles.erro}>{erros.dataNascimento}</Text>}
        </View>

        {/* Sexo */}
        <View style={styles.campo}>
          <Text style={styles.label}>Sexo *</Text>
          <View style={styles.sexoContainer}>
            <TouchableOpacity
              style={[
                styles.sexoButton,
                formData.sexo === 'M' && styles.sexoButtonSelecionado
              ]}
              onPress={() => atualizarCampo('sexo', 'M')}
            >
              <Text style={[
                styles.sexoButtonText,
                formData.sexo === 'M' && styles.sexoButtonTextSelecionado
              ]}>
                Masculino
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sexoButton,
                formData.sexo === 'F' && styles.sexoButtonSelecionado
              ]}
              onPress={() => atualizarCampo('sexo', 'F')}
            >
              <Text style={[
                styles.sexoButtonText,
                formData.sexo === 'F' && styles.sexoButtonTextSelecionado
              ]}>
                Feminino
              </Text>
            </TouchableOpacity>
          </View>
          {erros.sexo && <Text style={styles.erro}>{erros.sexo}</Text>}
        </View>

        {/* Telefone */}
        <View style={styles.campo}>
          <Text style={styles.label}>Telefone</Text>
          <TextInput
            style={styles.input}
            value={formData.telefone}
            onChangeText={(valor) => atualizarCampo('telefone', valor)}
            placeholder="(00) 00000-0000"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            maxLength={15}
          />
        </View>

        {/* Endereço */}
        <View style={styles.campo}>
          <Text style={styles.label}>Endereço</Text>
          <TextInput
            style={styles.input}
            value={formData.endereco}
            onChangeText={(valor) => atualizarCampo('endereco', valor)}
            placeholder="Rua, número, bairro"
            placeholderTextColor="#999"
          />
        </View>

        {/* Cidade */}
        <View style={styles.campo}>
          <Text style={styles.label}>Cidade</Text>
          <TextInput
            style={styles.input}
            value={formData.cidade}
            onChangeText={(valor) => atualizarCampo('cidade', valor)}
            placeholder="Nome da cidade"
            placeholderTextColor="#999"
          />
        </View>

        {/* Estado */}
        <View style={styles.campo}>
          <Text style={styles.label}>Estado</Text>
          <TextInput
            style={styles.input}
            value={formData.estado}
            onChangeText={(valor) => atualizarCampo('estado', valor)}
            placeholder="UF"
            placeholderTextColor="#999"
            maxLength={2}
          />
        </View>

        {/* CEP */}
        <View style={styles.campo}>
          <Text style={styles.label}>CEP</Text>
          <TextInput
            style={styles.input}
            value={formData.cep}
            onChangeText={(valor) => atualizarCampo('cep', valor)}
            placeholder="00000-000"
            placeholderTextColor="#999"
            keyboardType="numeric"
            maxLength={9}
          />
        </View>

        {/* Observações */}
        <View style={styles.campo}>
          <Text style={styles.label}>Observações</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.observacoes}
            onChangeText={(valor) => atualizarCampo('observacoes', valor)}
            placeholder="Observações adicionais sobre o paciente"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Botões */}
        <View style={styles.botoes}>
          <TouchableOpacity
            style={[styles.botao, styles.botaoCancelar]}
            onPress={onCancel}
            disabled={carregando}
          >
            <Text style={styles.botaoCancelarText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.botao, styles.botaoSalvar]}
            onPress={handleSave}
            disabled={carregando}
          >
            {carregando ? (
              <Text style={styles.botaoSalvarText}>Salvando...</Text>
            ) : (
              <Text style={styles.botaoSalvarText}>
                {modoEdicao ? 'Atualizar' : 'Salvar'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  campo: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputErro: {
    borderColor: '#e74c3c',
  },
  textArea: {
    height: 100,
  },
  erro: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: 5,
  },
  sexoContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  sexoButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  sexoButtonSelecionado: {
    backgroundColor: '#2E86AB',
    borderColor: '#2E86AB',
  },
  sexoButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  sexoButtonTextSelecionado: {
    color: 'white',
  },
  botoes: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 30,
    marginBottom: 20,
  },
  botao: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  botaoCancelar: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  botaoCancelarText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  botaoSalvar: {
    backgroundColor: '#2E86AB',
  },
  botaoSalvarText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});

export default FormularioPaciente;

