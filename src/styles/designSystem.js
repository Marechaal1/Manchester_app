/**
 * Sistema de Design Padrão da Aplicação
 * Baseado no design moderno do fluxo de SAE
 */

import { StyleSheet } from 'react-native';
import { Platform, StatusBar } from 'react-native';

// Cores do sistema
export const cores = {
  primaria: '#2E86AB',
  primariaEscura: '#1a5f7a',
  secundaria: '#27ae60',
  aviso: '#f39c12',
  erro: '#e74c3c',
  sucesso: '#27ae60',
  branco: '#ffffff',
  cinzaClaro: '#f8f9fa',
  cinza: '#6c757d',
  cinzaEscuro: '#333333',
  transparente: 'rgba(255, 255, 255, 0.2)',
  transparenteClaro: 'rgba(255, 255, 255, 0.3)',
  transparenteMedio: 'rgba(255, 255, 255, 0.7)',
};

// Tipografia
export const tipografia = {
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cores.cinzaEscuro,
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: '600',
    color: cores.cinzaEscuro,
  },
  cabecalho: {
    fontSize: 16,
    fontWeight: 'bold',
    color: cores.cinzaEscuro,
  },
  corpo: {
    fontSize: 14,
    fontWeight: '400',
    color: cores.cinzaEscuro,
  },
  legenda: {
    fontSize: 12,
    fontWeight: '400',
    color: cores.cinza,
  },
  botao: {
    fontSize: 16,
    fontWeight: '600',
    color: cores.branco,
  },
};

// Sombras padrão
export const sombras = {
  pequena: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  media: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  grande: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
};

// Espaçamentos
export const espacamentos = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Bordas
export const raioBorda = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  completo: 50,
};

// Estilos padrão para componentes
export const estilosComuns = StyleSheet.create({
  // Container principal
  container: {
    flex: 1,
    backgroundColor: cores.cinzaClaro,
  },
  
  // Header padrão
  header: {
    backgroundColor: cores.primaria,
    paddingTop: Platform.select({ ios: 50, android: (StatusBar.currentHeight || 24) + 10 }),
    paddingBottom: 15,
    paddingHorizontal: 20,
    ...sombras.media,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    ...tipografia.subtitulo,
    color: cores.branco,
    flex: 1,
    textAlign: 'center',
  },
  headerSubtitle: {
    ...tipografia.legenda,
    color: cores.transparenteMedio,
    textAlign: 'center',
    marginTop: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: raioBorda.completo,
    backgroundColor: cores.transparente,
  },
  progressSpacer: {
    width: 34,
  },
  
  // Header padrão (versão antiga - manter para compatibilidade)
  cabecalho: {
    backgroundColor: cores.primaria,
    paddingTop: Platform.select({ ios: 50, android: (StatusBar.currentHeight || 24) + 10 }),
    paddingBottom: 15,
    paddingHorizontal: 20,
    ...sombras.media,
  },
  conteudoCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tituloCabecalho: {
    ...tipografia.subtitulo,
    color: cores.branco,
    flex: 1,
    textAlign: 'center',
  },
  subtituloCabecalho: {
    ...tipografia.legenda,
    color: cores.transparenteMedio,
    textAlign: 'center',
    marginTop: 4,
  },
  botaoVoltar: {
    padding: 8,
    borderRadius: raioBorda.completo,
    backgroundColor: cores.transparente,
  },
  
  // Cards padrão
  card: {
    backgroundColor: cores.branco,
    borderRadius: raioBorda.md,
    padding: espacamentos.lg,
    marginBottom: espacamentos.lg,
    ...sombras.media,
  },
  cabecalhoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: espacamentos.md,
  },
  tituloCard: {
    ...tipografia.cabecalho,
    marginLeft: espacamentos.sm,
  },
  conteudoCard: {
    flex: 1,
  },
  
  // Seções
  secao: {
    backgroundColor: cores.branco,
    borderRadius: raioBorda.md,
    padding: espacamentos.lg,
    marginBottom: espacamentos.lg,
    ...sombras.media,
  },
  cabecalhoSecao: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: espacamentos.md,
  },
  tituloSecao: {
    ...tipografia.cabecalho,
    marginLeft: espacamentos.sm,
  },
  
  // Botões
  botao: {
    backgroundColor: cores.primaria,
    paddingVertical: espacamentos.md,
    paddingHorizontal: espacamentos.xl,
    borderRadius: raioBorda.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombras.pequena,
  },
  textoBotao: {
    ...tipografia.botao,
  },
  botaoSecundario: {
    backgroundColor: cores.branco,
    borderWidth: 1,
    borderColor: cores.primaria,
  },
  textoBotaoSecundario: {
    ...tipografia.botao,
    color: cores.primaria,
  },
  botaoSucesso: {
    backgroundColor: cores.sucesso,
  },
  botaoAviso: {
    backgroundColor: cores.aviso,
  },
  botaoErro: {
    backgroundColor: cores.erro,
  },
  
  // Inputs
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: raioBorda.sm,
    paddingHorizontal: espacamentos.md,
    paddingVertical: espacamentos.sm,
    fontSize: 16,
    color: cores.cinzaEscuro,
    backgroundColor: cores.branco,
  },
  inputFocado: {
    borderColor: cores.primaria,
    ...sombras.pequena,
  },
  inputErro: {
    borderColor: cores.erro,
  },
  labelInput: {
    ...tipografia.corpo,
    marginBottom: espacamentos.sm,
    fontWeight: '500',
  },
  
  // Listas
  itemLista: {
    backgroundColor: cores.branco,
    padding: espacamentos.lg,
    borderRadius: raioBorda.sm,
    marginBottom: espacamentos.sm,
    ...sombras.pequena,
  },
  cabecalhoItemLista: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: espacamentos.sm,
  },
  tituloItemLista: {
    ...tipografia.cabecalho,
    marginLeft: espacamentos.sm,
  },
  
  // Status e badges
  badge: {
    paddingHorizontal: espacamentos.sm,
    paddingVertical: espacamentos.xs,
    borderRadius: raioBorda.sm,
    alignSelf: 'flex-start',
  },
  badgePrimario: {
    backgroundColor: cores.primaria,
  },
  badgeSucesso: {
    backgroundColor: cores.sucesso,
  },
  badgeAviso: {
    backgroundColor: cores.aviso,
  },
  badgeErro: {
    backgroundColor: cores.erro,
  },
  textoBadge: {
    ...tipografia.legenda,
    color: cores.branco,
    fontWeight: '600',
  },
  
  // Progress indicators
  containerProgresso: {
    backgroundColor: cores.primaria,
    paddingVertical: espacamentos.md,
    paddingHorizontal: espacamentos.lg,
    ...sombras.media,
  },
  passoProgresso: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: cores.transparenteClaro,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: espacamentos.sm,
  },
  passoProgressoAtivo: {
    backgroundColor: cores.branco,
    ...sombras.pequena,
  },
  textoPassoProgresso: {
    ...tipografia.legenda,
    color: cores.transparenteMedio,
    textAlign: 'center',
  },
  textoPassoProgressoAtivo: {
    color: cores.branco,
    fontWeight: '600',
  },
  
  // Alertas e notificações
  alerta: {
    padding: espacamentos.lg,
    borderRadius: raioBorda.sm,
    marginBottom: espacamentos.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertaSucesso: {
    backgroundColor: '#d4edda',
    borderLeftWidth: 4,
    borderLeftColor: cores.sucesso,
  },
  alertaAviso: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: cores.aviso,
  },
  alertaErro: {
    backgroundColor: '#f8d7da',
    borderLeftWidth: 4,
    borderLeftColor: cores.erro,
  },
  textoAlerta: {
    ...tipografia.corpo,
    marginLeft: espacamentos.sm,
    flex: 1,
  },
  
  // Loading e estados vazios
  containerCarregamento: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espacamentos.xxl,
  },
  containerVazio: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: espacamentos.xxl,
  },
  textoVazio: {
    ...tipografia.corpo,
    color: cores.cinza,
    textAlign: 'center',
    marginTop: espacamentos.md,
  },
});

// Ícones padrão para diferentes seções
export const icones = {
  // Navegação
  voltar: 'arrow-back',
  menu: 'menu',
  fechar: 'close',
  
  // Ações
  adicionar: 'add',
  editar: 'create',
  deletar: 'trash',
  salvar: 'save',
  cancelar: 'close-circle',
  
  // Status
  sucesso: 'checkmark-circle',
  aviso: 'warning',
  erro: 'alert-circle',
  info: 'information-circle',
  
  // Seções
  paciente: 'person',
  medico: 'medical',
  pulso: 'pulse',
  documento: 'document-text',
  prancheta: 'clipboard',
  construir: 'bed',
  intervencoes: 'fitness',
  tendencia: 'trending-up',
  lista: 'list',
  
  // Específicos
  cpf: 'card',
  calendario: 'calendar',
  tempo: 'time',
  localizacao: 'location',
  telefone: 'call',
  email: 'mail',
  usuario: 'person-circle',
};

export default {
  cores,
  tipografia,
  sombras,
  espacamentos,
  raioBorda,
  estilosComuns,
  icones,
};