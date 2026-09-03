export async function collectPaginated({
  fetchPage,
  getKey,
  itemsKey,
  limit,
}) {
  const items = [];
  const itemKeys = new Set();
  const visitedOffsets = new Set();
  let offset = 0;

  while (true) {
    if (visitedOffsets.has(offset)) {
      throw new Error("Pagination returned a repeated offset.");
    }
    visitedOffsets.add(offset);

    const page = await fetchPage({ limit, offset });
    const pageItems = page?.[itemsKey];
    if (!Array.isArray(pageItems)) {
      throw new Error(`Pagination response is missing ${itemsKey}.`);
    }

    for (const item of pageItems) {
      const key = getKey(item);
      if (key === undefined || key === null || key === "") {
        throw new Error("Pagination item is missing its stable identity.");
      }
      if (!itemKeys.has(key)) {
        itemKeys.add(key);
        items.push(item);
      }
    }

    if (page.nextOffset !== undefined && page.nextOffset !== null) {
      if (Number.isInteger(page.nextOffset) && page.nextOffset > offset) {
        offset = page.nextOffset;
        continue;
      }
      throw new Error("Pagination returned a repeated offset.");
    }

    const totalItemCount = Number(page.totalItemCount);
    const fallbackOffset = offset + pageItems.length;
    if (
      pageItems.length > 0 &&
      Number.isFinite(totalItemCount) &&
      fallbackOffset < totalItemCount
    ) {
      offset = fallbackOffset;
      continue;
    }

    return items;
  }
}
