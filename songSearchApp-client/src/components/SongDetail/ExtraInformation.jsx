function ExtraInformation({ song }) {
  console.log(song);
  if (!song) return null;

  return (
    <div>
  <h2>Extra Information</h2>
  <p><strong>Songbook References & Translations:</strong></p>
  <ul>
    {song.book.map(book => (
      <li key={`book-${book.slug}`}>
        {book.name}: {book.number}{" "}
        {book.hymnal_url && (
          <a href={book.hymnal_url} target="_blank" rel="noopener noreferrer">
            View on hymnal.net
          </a>
        )}
      </li>
    ))}

    {song.translations && song.translations.length > 0 &&
      song.translations.map(translation => (
        <li key={`translation-${translation.songbase_id}`}>
          <a href={translation.url} target="_blank" rel="noopener noreferrer">
            {translation.language}: {translation.number_in_book} ({translation.title})
          </a>
        </li>
      ))}
  </ul>
</div>

  );
}

export default ExtraInformation;