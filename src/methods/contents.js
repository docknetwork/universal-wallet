export const WALLET_TYPE_ANCHOR = 'DockAnchor';

export function isCorrelated(content, to) {
  if (Array.isArray(content.correlation)) {
    return content.correlation.indexOf(to) > -1;
  }
  return content.correlation === to;
}

export function isType(content, type) {
  if (Array.isArray(content.type)) {
    return content.type.indexOf(type) > -1;
  }
  return content.type === type;
}

export async function getCorrelatedMetadata(to, wallet) {
  const result = await wallet.query({
    equals: {
      'content.type': 'Metadata',
    },
  });
  return result.filter((content) => isCorrelated(content, to));
}

export async function getCredentialAnchors(credential, wallet) {
  const { id } = credential;
  const metadata = await getCorrelatedMetadata(id, wallet);
  return metadata.filter((content) => isType(content, WALLET_TYPE_ANCHOR));
}
