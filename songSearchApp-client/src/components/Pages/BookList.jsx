import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function BookList() {
  // fetch the list of all books from the API
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/books`);
        const data = await res.json();
        setBooks(data);
      } catch (err) {
        console.error('Error fetching books:', err);
      }
    };

    fetchBooks();
  }, []);
  console.log('Books fetched:', books);

  if (!books.length) return <p>Loading books...</p>;

  return (
    <div className="books-container">
      <h1>Songbooks:</h1>
      <ul>
        {books.map(book => (
          <li key={book.slug}>
            <Link to={`/books/${book.slug}`}>{book.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default BookList;