const BLEXO_CONFIG_KEY = 'blexo-unificado-config-v2';

const BLEXO_DEFAULT_CONFIG = {
  watermark: true,
  photoTemplate: 'four',
  checkPhotoTemplate: 'four',
  leituristaPhotoTemplate: 'two',
  orcamentosPhotoTemplate: 'two',

  sealConfig: 'Antes|texto|#123047\nDepois|texto|#176d9a\nVerde|bolinha|#36a269\nAmarelo|bolinha|#e5b22e\nVermelho|bolinha|#cb4c4c',

  blockCount: 26,

  commonAreas: [
    'Salões 1',
    'Salões 2',
    'Academia',
    'Sanepar'
  ],

  rondaAreas: [
    'Salão 1',
    'Salão 2',
    'Academia',
    'Brinquedoteca',
    'Quadra',
    'Churrasqueira Aberta',
    'Espaço Pet',
    'Sede',
    'Portão dos Fundos'
  ],

  rondaHeaderColor: '#123047',
  rondaHeaderName: 'Ronda',

  enableGas: true,
  enableWater: true,

  checkHeaderColor: '#123047',
  leituristaHeaderColor: '#123047',
  scannerHeaderColor: '#123047',
  rateioHeaderColor: '#123047',
  orcamentosHeaderColor: '#123047',
  reembolsoHeaderColor: '#123047',

  orcamentosHeaderName: 'Orçamento',
  reembolsoHeaderName: 'Reembolso',
  rateioHeaderName: 'Rateio',

  tagPedestreValue: 10,
  tagVeiculoValue: 20,
  mudancaEntradaValue: 180,
  mudancaSaidaValue: 180,

  ressarcimentoItems: [
    { name: 'Copo', value: 10 },
    { name: 'Prato', value: 20 },
    { name: 'Talher', value: 5 },
    { name: 'Outros', value: 1 }
  ],

  checkHeaderName: 'Check',
  leituristaHeaderName: 'Leiturista',
  scannerHeaderName: 'Scanner',

  checkHeaderIcon: '✓',
  leituristaHeaderIcon: 'L',
  scannerHeaderIcon: 'S'
};

function blexoConfig() {
  try {
    const raw = localStorage.getItem(BLEXO_CONFIG_KEY);
    const saved = raw ? JSON.parse(raw) : {};

    const merged = {
      ...BLEXO_DEFAULT_CONFIG,
      ...(saved && typeof saved === 'object' ? saved : {})
    };

    // Protege listas que devem existir
    if (!Array.isArray(merged.commonAreas) || merged.commonAreas.length === 0) {
      merged.commonAreas = [...BLEXO_DEFAULT_CONFIG.commonAreas];
    }

    if (!Array.isArray(merged.rondaAreas) || merged.rondaAreas.length === 0) {
      merged.rondaAreas = [...BLEXO_DEFAULT_CONFIG.rondaAreas];
    }

    if (
      !Array.isArray(merged.ressarcimentoItems) ||
      merged.ressarcimentoItems.length === 0
    ) {
      merged.ressarcimentoItems =
        BLEXO_DEFAULT_CONFIG.ressarcimentoItems.map(item => ({...item}));
    }

    return merged;

  } catch (error) {
    console.error('Erro ao carregar configurações do Blexo:', error);
    return {
      ...BLEXO_DEFAULT_CONFIG,
      commonAreas: [...BLEXO_DEFAULT_CONFIG.commonAreas],
      rondaAreas: [...BLEXO_DEFAULT_CONFIG.rondaAreas],
      ressarcimentoItems:
        BLEXO_DEFAULT_CONFIG.ressarcimentoItems.map(item => ({...item}))
    };
  }
}

function saveBlexoConfig(config) {
  const current = blexoConfig();

  const merged = {
    ...BLEXO_DEFAULT_CONFIG,
    ...current,
    ...(config || {})
  };

  localStorage.setItem(
    BLEXO_CONFIG_KEY,
    JSON.stringify(merged)
  );

  return merged;
}

function resetBlexoConfig() {
  const config = {
    ...BLEXO_DEFAULT_CONFIG,
    commonAreas: [...BLEXO_DEFAULT_CONFIG.commonAreas],
    rondaAreas: [...BLEXO_DEFAULT_CONFIG.rondaAreas],
    ressarcimentoItems:
      BLEXO_DEFAULT_CONFIG.ressarcimentoItems.map(item => ({...item}))
  };

  localStorage.setItem(
    BLEXO_CONFIG_KEY,
    JSON.stringify(config)
  );

  return config;
}
