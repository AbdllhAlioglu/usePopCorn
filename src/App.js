import { useEffect, useState } from "react";
import StarRating from "./StarRating";

const average = (arr) => arr.reduce((acc, cur) => acc + cur / arr.length, 0);

const KEY = process.env.REACT_APP_OMDB_API_KEY;

export default function App() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [watched, setWatched] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const handleSelectMovie = (id) => {
    setSelectedId(id);
  };

  function handleAddWatched(movie) {
    setWatched((watched) => [...watched, movie]);
  }

  function handleDeleteWatched(id) {
    setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
  }

  const handleCloseMovie = () => {
    setSelectedId(null);
  };

  useEffect(() => {
    if (query.length < 3) {
      setMovies([]);
      setError("");
      return;
    }

    const fetchMovies = async () => {
      try {
        setIsLoading(true);
        setError("");

        if (!KEY) {
          throw new Error(
            "API anahtarı bulunamadı. Lütfen .env.local dosyasını kontrol edin."
          );
        }

        const res = await fetch(
          `https://www.omdbapi.com/?apikey=${KEY}&s=${query}`
        );

        if (!res.ok) {
          throw new Error("Something went wrong");
        }

        const data = await res.json();

        if (data.Response === "False") throw new Error("Movie not found");
        setMovies(data.Search);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchMovies();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <>
      <Navbar>
        <Logo />
        <Search query={query} setQuery={setQuery} />
        <NumResult movies={movies} />
      </Navbar>

      <Main>
        <Box className="box-left">
          {selectedId ? (
            <MovieDetails
              selectedId={selectedId}
              onCloseMovie={handleCloseMovie}
              isLoading={isLoading}
              onAddWatched={handleAddWatched}
            />
          ) : (
            <>
              {isLoading && <Loader />}
              {!isLoading && !error && (
                <MovieList movies={movies} onSelectMovie={handleSelectMovie} />
              )}
              {error && <ErrorMessage message={error} />}
            </>
          )}
        </Box>

        <Box className="box-right">
          <WatchedSummary watched={watched} />
          <WatchedMovieList
            watched={watched}
            onDeleteWatched={handleDeleteWatched}
          />
        </Box>
      </Main>
    </>
  );
}

function ErrorMessage({ message }) {
  return (
    <p className="error">
      <span>❌ {message}</span>
    </p>
  );
}

function Loader() {
  return <p className="loader">Loading..</p>;
}

function Navbar({ children }) {
  return <nav className="nav-bar">{children}</nav>;
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🎬</span>
      <h1>CineMagic</h1>
    </div>
  );
}

function Search({ query, setQuery }) {
  const [placeholder, setPlaceholder] = useState([]);

  useEffect(() => {
    const messages = [
      "Inception..",
      "ınterstellar..",
      "Green mile..",
      "The Godfather...",
      "The Shawshank Redemption...",
      "Schindler's List...",
      "Pulp Fiction...",
      "The Dark Knight...",
      "The Lord of the Rings...",
      "Breaking Bad...",
      "Game of Thrones...",
    ];
    let messageIndex = 0;
    let charIndex = 0;
    let direction = 1; // 1 for writing, -1 for deleting

    const updatePlaceholder = () => {
      setPlaceholder(messages[messageIndex].slice(0, charIndex));
      charIndex += direction;

      if (charIndex === messages[messageIndex].length + 1 || charIndex === 0) {
        direction *= -1; // change direction
        if (direction === 1) {
          messageIndex = (messageIndex + 1) % messages.length;
        }
      }
    };

    const intervalId = setInterval(updatePlaceholder, 150);

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, []);

  return (
    <input
      className="search"
      type="text"
      placeholder={placeholder}
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}

function NumResult({ movies }) {
  const numResults = movies ? movies.length : 0;
  return (
    <p className="num-results">
      Found <strong>{numResults}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  );
}

function MovieList({ movies, onSelectMovie }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie movie={movie} key={movie.imdbID} onSelectMovie={onSelectMovie} />
      ))}
    </ul>
  );
}

function MovieDetails({ selectedId, onCloseMovie, isLoading, onAddWatched }) {
  const [movie, setMovie] = useState({});
  const [userRating, setUserRating] = useState("");

  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = movie;

  function handleAdd() {
    const newWatchedMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ")[0]),
      userRating,
    };
    onAddWatched(newWatchedMovie);
    onCloseMovie(); // Movie eklendikten sonra detay ekranını kapatmak için
  }

  useEffect(() => {
    document.addEventListener("keydown", function callback(e) {
      if (e.code === "Escape") {
        onCloseMovie();
      }
      return function () {
        document.removeEventListener("keydown", callback);
      };
    });
  }, [onCloseMovie]);
  useEffect(() => {
    async function getMovieDetail() {
      try {
        if (!KEY) {
          throw new Error(
            "API anahtarı bulunamadı. Lütfen .env.local dosyasını kontrol edin."
          );
        }

        const res = await fetch(
          `https://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`
        );
        const data = await res.json();
        setMovie(data);
      } catch (error) {
        console.error("Film detayları alınamadı:", error);
      }
    }
    getMovieDetail();
  }, [selectedId]);

  useEffect(
    function () {
      if (!title) return;
      document.title = `Movie | ${title}`;
      return function () {
        document.title = "CineMagic";
      };
    },
    [title]
  );

  return (
    <div className="details">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={onCloseMovie}>
              ↩️
            </button>

            <img src={poster} alt={`Poster of ${title} movie`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐️</span>
                {imdbRating}
              </p>
            </div>
          </header>
          <section>
            <div className="rating">
              <StarRating
                maxRating={10}
                size={24}
                onSetRating={setUserRating}
              />
              {userRating > 0 && (
                <button className="btn-add" onClick={handleAdd}>
                  + Add to list
                </button>
              )}
            </div>

            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </>
      )}
    </div>
  );
}

function Movie({ movie, onSelectMovie }) {
  return (
    <li className="movie-card" onClick={() => onSelectMovie(movie.imdbID)}>
      <div className="movie-poster">
        <img
          src={
            movie.Poster && movie.Poster !== "N/A"
              ? movie.Poster
              : "https://via.placeholder.com/300x450?text=No+Image+Available"
          }
          alt={`${movie.Title} poster`}
          onError={(e) => {
            e.target.src =
              "https://via.placeholder.com/300x450?text=No+Image+Available";
          }}
        />
      </div>
      <div className="movie-info">
        <h3>
          {movie.Title || "Unknown Title"} <span>({movie.Year || "N/A"})</span>
        </h3>
      </div>
    </li>
  );
}

function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));
  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating.toFixed(1)}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating.toFixed(1)}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime.toFixed(1)} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMovieList({ watched, onDeleteWatched }) {
  return (
    <ul className="list list-watched">
      {watched.map((movie) => (
        <WatchedMovie
          movie={movie}
          key={movie.imdbID}
          onDeleteWatched={onDeleteWatched}
        />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, onDeleteWatched }) {
  return (
    <li>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <button
          onClick={() => onDeleteWatched(movie.imdbID)}
          className="btn-delete"
        >
          ❌
        </button>
      </div>
    </li>
  );
}
