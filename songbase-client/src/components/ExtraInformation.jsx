function ExtraInformation({ song }) {
  if (!song) return null;

  return (
    <div>
      <h2>Extra Information</h2>
      <p><strong>Books:</strong></p>
      <ul>
        {song.book.map(book => (
          <li key={book.slug}>
            {book.name} {book.hymnal_url && <a href={book.hymnal_url} target="_blank" rel="noopener noreferrer">View on hymnal.net</a>}
          </li>
        ))}
      </ul>
      {song.translations && song.translations.length > 0 && (
        <>
          <p><strong>Translations:</strong></p>
          <ul>
            {song.translations.map(translation => (
              <li key={translation.songbase_id}>
                <a href={translation.url} target="_blank" rel="noopener noreferrer">
                  {translation.language}: {translation.title}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default ExtraInformation;