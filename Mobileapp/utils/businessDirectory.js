function optionalText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function getBusinessDirectoryPages(data) {
  return data?.pages ?? [];
}

export function normalizeBusiness(record) {
  const id = optionalText(record?.id || record?.$id);
  const name = optionalText(record?.storeName) || optionalText(record?.name);

  if (!id || !name) {
    throw new Error("The business response is missing its ID or store name.");
  }

  const city = optionalText(record.city);
  const country = optionalText(record.country);
  const location =
    city && country
      ? `${city}, ${country}`
      : city || country || optionalText(record.location);

  return {
    id,
    name,
    category: optionalText(record.category),
    description: optionalText(record.storeDescription),
    location,
    coverImage: optionalText(record.coverImage),
    profileImage: optionalText(record.profileImage),
    createdAt: optionalText(record.createdAt || record.$createdAt),
  };
}

export function getBusinessDescriptionPreview(description, sentenceLimit = 1) {
  const sentences = optionalText(description).match(
    /[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g,
  );

  return (sentences || [])
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, sentenceLimit)
    .join(" ");
}
