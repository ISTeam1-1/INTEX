import React, { useEffect, useRef, useState } from 'react';
import MoviePoster from './MoviePoster';
import MovieDetails from './MovieDetails';
import { Movie } from '../../types/Movie.ts';
import { fetchAllMovies } from '../../api/MoviesAPI';
import '../../css/MoviePage.css';

interface MovieCarouselProps {
  title: string;
  filter?: (movie: Movie) => boolean;
  chunkSize?: number;
  movies?: Movie[]; // ← ✅ Add this line
  showEmptyPoster?: boolean;
  onPosterClick?: (movie: Movie) => void;
  placeholderMessage?: string;
  showLibraryControls?: boolean;
}

const MovieCarousel: React.FC<MovieCarouselProps> = ({
  title,
  filter,
  movies = [],
}) => {
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load movies
  useEffect(() => {
    const load = async () => {
      if (movies && movies.length > 0) {
        const filtered = filter ? movies.filter(filter) : movies;
        setAllMovies(filtered);
      } else {
        try {
          const fetched = await fetchAllMovies();
          const filtered = filter ? fetched?.filter(filter) : fetched;
          setAllMovies(filtered ?? []); // ⬅ fallback for undefined
        } catch (err) {
          console.error('Failed to load movies:', err);
        }
      }
    };
    load();
  }, [filter, movies]);

  // Update scroll arrows
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScrollState = () => {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft + container.clientWidth < container.scrollWidth - 1
      );
    };

    container.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);
    updateScrollState();

    return () => {
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [allMovies]);

  // Scroll by a page
  const scrollByAmount = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.9;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  // Handle selecting a movie (with a delay to reset modal)
  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(null); // Close current modal
    setTimeout(() => {
      setSelectedMovie(movie); // Reopen with new movie
    }, 100); // Small delay ensures clean remount
  };

  return (
    <div
      className="movie-section my-4"
      style={{
        maxWidth: '100vw',
        paddingLeft: '4rem', // More left margin
        paddingRight: '2rem', // Optional: shrink right margin
      }}
    >
      <h5
        className="carousel-title text-start fw-bold mb-2"
        style={{ fontSize: '2.5rem' }}
      >
        {title}:
      </h5>

      <div className="d-flex align-items-center">
        {/* Left Arrow */}
        {canScrollLeft && (
          <div
            className="arrow-icon"
            style={{
              marginRight: '0.5rem',
              fontSize: '1.8rem',
              cursor: 'pointer',
              zIndex: 1,
            }}
            onClick={() => scrollByAmount('left')}
          >
            <i className="bi bi-arrow-left-circle" />
          </div>
        )}

        {/* Movie Row */}
        <div className="movie-row-wrapper">
          <div
            ref={containerRef}
            className="movie-row"
            style={{
              display: 'flex',
              flexWrap: 'nowrap',
              gap: '1rem',
              height: '100%',
              overflow: 'hidden',
              scrollBehavior: 'smooth',
              paddingBottom: '0.5rem',
            }}
          >
            {allMovies.map((movie, i) => (
              <MoviePoster
                key={`${movie.showId ?? 'no-id'}-${movie.title ?? 'untitled'}-${i}`}
                movie={movie}
                onClick={() => handleSelectMovie?.(movie)}
                style={{ minWidth: '250px', maxWidth: '275px' }}
                showLibraryButton={title === 'My Library'} // ✅ Add this
              />
            ))}
          </div>
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <div
            className="arrow-icon"
            style={{
              marginLeft: '0.5rem',
              fontSize: '1.8rem',
              cursor: 'pointer',
              zIndex: 1,
            }}
            onClick={() => scrollByAmount('right')}
          >
            <i className="bi bi-arrow-right-circle" />
          </div>
        )}
      </div>

      {/* Movie Modal */}
      {selectedMovie && (
        <MovieDetails
          key={selectedMovie.showId} // 👈 This forces full remount
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onSelectMovie={handleSelectMovie} // 👈 use the delayed handler
        />
      )}
    </div>
  );
};

export default MovieCarousel;
