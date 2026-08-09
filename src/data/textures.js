/**
 * URLs for sourced texture assets (see ASSETS §5 for license tracking). Vite resolves these
 * imports to hashed, build-copied URLs — the files live in /assets, not /public, so this module
 * is the only place that needs to know their on-disk path.
 */
import sandstoneDiffuseUrl from '../../assets/textures/polyhaven-large-sandstone-blocks/diffuse_1k.jpg?url';
import sandstoneNormalUrl from '../../assets/textures/polyhaven-large-sandstone-blocks/normal_1k.jpg?url';
import sandstoneRoughnessUrl from '../../assets/textures/polyhaven-large-sandstone-blocks/roughness_1k.jpg?url';
import sandstoneAoUrl from '../../assets/textures/polyhaven-large-sandstone-blocks/ao_1k.jpg?url';

export const SANDSTONE_TEXTURE_URLS = {
  diffuse: sandstoneDiffuseUrl,
  normal: sandstoneNormalUrl,
  roughness: sandstoneRoughnessUrl,
  ao: sandstoneAoUrl
};
