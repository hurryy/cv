import type { CvStyle } from './cv-style';

/**
 * Style affiché à qui n'en a pas choisi, et à un `?style=` inconnu. Seul réglage à changer (puis
 * redéployer) : le prérendu l'écrit dans `<html data-style>`, que le CSS et le script inline de
 * `index.html` reprennent.
 */
export const DEFAULT_STYLE: CvStyle = 'sobre';
