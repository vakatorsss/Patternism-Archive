import { DEFAULT_ADDRESS, formatAddress, formatPageAddress, pageAddress, type BookAddress } from "../generation/bookAddress";

export const DEFAULT_TEXT_PATH = `/text/${formatPageAddress(DEFAULT_ADDRESS)}`;

export function getTextPath(address: BookAddress) {
  const safe = pageAddress(address);

  if (address.line && address.line > 1) {
    return `/text/${formatAddress({ ...safe, line: address.line })}`;
  }

  return `/text/${formatPageAddress(safe)}`;
}
