const BLEXO_CONFIG_KEY = 'blexo-unificado-config-v2';
const BLEXO_DEFAULT_CONFIG = {
  watermark: true,
  photoTemplate: 'four',
  checkPhotoTemplate: 'four',
  leituristaPhotoTemplate: 'two',
  orcamentosPhotoTemplate: 'two',
  sealConfig: 'Antes|texto|#123047\nDepois|texto|#176d9a\nVerde|bolinha|#36a269\nAmarelo|bolinha|#e5b22e\nVermelho|bolinha|#cb4c4c',
  blockCount: 26,
  commonAreas: ['Salões 1', 'Salões 2', 'Academia', 'Sanepar'],
  enableGas: true,
  enableWater: true,
  checkHeaderColor: '#123047',
  leituristaHeaderColor: '#123047',
  scannerHeaderColor: '#123047',
  rateioHeaderColor: '#123047',
  orcamentosHeaderColor: '#123047',
  orcamentosHeaderName: 'Blexo-Orçamento',
  rateioHeaderName: 'Blexo-Rateio',
  tagPedestreValue: 15,
  tagVeiculoValue: 30,
  mudancaEntradaValue: 180,
  mudancaSaidaValue: 180,
  checkHeaderName: 'Blexo-Check',
  leituristaHeaderName: 'Blexo-Leiturista',
  scannerHeaderName: 'Blexo-Scanner',
  rateioHeaderName: 'Blexo-Rateio',
  checkHeaderIcon: '✓',
  leituristaHeaderIcon: 'L',
  scannerHeaderIcon: 'S'
};
function blexoConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(BLEXO_CONFIG_KEY) || 'null');
    return {...BLEXO_DEFAULT_CONFIG, ...(saved || {})};
  } catch { return {...BLEXO_DEFAULT_CONFIG}; }
}
function saveBlexoConfig(config) {
  const merged = {...BLEXO_DEFAULT_CONFIG, ...(config || {})};
  localStorage.setItem(BLEXO_CONFIG_KEY, JSON.stringify(merged));
  return merged;
}
function resetBlexoConfig() {
  localStorage.setItem(BLEXO_CONFIG_KEY, JSON.stringify(BLEXO_DEFAULT_CONFIG));
  return {...BLEXO_DEFAULT_CONFIG};
}
