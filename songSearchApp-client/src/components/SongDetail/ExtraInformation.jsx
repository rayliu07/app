function ExtraInformation({ song }) {
  if (!song) return null;

  return (
    <div>
      <h2>Extra Information</h2>
      <p><strong>Songbook References & Translations:</strong></p>
      <ul>
        {song.book.map(book => (
          <li key={`book-${book.slug}`}>
            {book.name}: {book.number}
            {book.hymnal_url && (
              <span> (<a
                href={book.hymnal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="extra-link"
              >
                View on hymnal.net
              </a>)</span>
            )}
          </li>
        ))}

        {song.translations && song.translations.length > 0 &&
          song.translations.map(translation => (
            <li key={`translation-${translation.songbase_id}`}>
              {translation.language}: {translation.number_in_book} (
              <a
                href={translation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="extra-link"
              >
                {translation.title}
              </a>
              )
            </li>
          ))}
      </ul>
    </div>
  );
}

export default ExtraInformation;
