
// MoviePage.tsx
import React, { useEffect, useState  } from 'react';
import { fetchAllMovies, fetchMoviesByGenre } from '../api/MoviesAPI';
import { fetchAllHybridRecommendationsSecure } from '../api/HybridAPI';
import { Recommend } from '../types/HybridRecommender';
import MovieCarousel from '../components/Movie/MovieCarousel';
import MovieFilterBar from '../components/Movie/MovieFilterBar';
import RecommendedMovies from '../components/Movie/RecommendedMovies';
import TopGenresSection from '../components/Movie/TopGenresSection';
import Paginator from '../components/Movie/Paginator';
import { genreMap } from '../constants/genreMap';
import { Movie } from '../types/Movie';
import '../css/MoviePage.css';
import { Button, Container } from 'react-bootstrap';
import { Search } from 'lucide-react';
import { getMovie } from '../api/MoviesAPI'; // Make sure this is already imported
import MovieDetails from '../components/Movie/MovieDetails.tsx';
import LibraryRow from '../components/Movie/LibraryRow.tsx';
import AllMoviesGrid from '../components/Movie/AllMoviesGrid.tsx';

const useInView = () => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
};

const GenreSection: React.FC<{ genreKey: string; label: string }> = ({
  genreKey,
  label,
}) => {
  const { ref, isVisible } = useInView();
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    if (isVisible && movies.length === 0) {
      fetchMoviesByGenre(genreKey).then((res) => res && setMovies(res));
    }
  }, [isVisible, genreKey, movies.length]);

  return (
    <div ref={ref} style={{ minHeight: '200px', marginBottom: '2rem' }}>
      {isVisible && movies.length > 0 && (
        <MovieCarousel
          title={label}
          filter={(movie) => movies.some((m) => m.showId === movie.showId)}
          movies={[]}
        />
      )}
    </div>
  );
};

const MoviePage: React.FC = () => {
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterApplied, setFilterApplied] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showAllMovies, setShowAllMovies] = useState(false);
  const [showTopGenres, setShowTopGenres] = useState(true);
  const [pageSize, setPageSize] = useState(10);
  const [, setRecommendations] = useState<Recommend[]>([]);

  const itemsPerPage = 12;


  useEffect(() => {
    const load = async () => {
      const movies = await fetchAllMovies();
      if (movies) {
        setAllMovies(movies);
        setFilteredMovies(movies);
      }

      // Hybrid recommendations
      const recommendationsData = await fetchAllHybridRecommendationsSecure();
      if (recommendationsData) {
        setRecommendations(recommendationsData);
      }
    };

    load();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMovies.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);

  const handleFilterChange = ({
    searchText,
    genre,
    sortBy,
  }: {
    searchText: string;
    genre: string;
    sortBy: string;
  }) => {
    let result = [...allMovies];

    if (searchText) {
      result = result.filter((m) =>
        m.title?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (genre) {
      const genreKey = Object.entries(genreMap).find(
        ([, label]) => label === genre
      )?.[0];
      if (genreKey)
        result = result.filter((m) => m[genreKey as keyof Movie] === 1);
    }

    switch (sortBy) {
      case 'directorAZ':
        result.sort((a, b) =>
          (a.director || '').localeCompare(b.director || '')
        );
        break;
      case 'directorZA':
        result.sort((a, b) =>
          (b.director || '').localeCompare(a.director || '')
        );
        break;
      case 'yearAsc':
        result.sort((a, b) => (a.releaseYear ?? 0) - (b.releaseYear ?? 0));
        break;
      case 'yearDesc':
        result.sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0));
        break;
    }

    setFilteredMovies(result);
    setCurrentPage(1);
    setFilterApplied(true);
    setShowAllMovies(false);
    setShowTopGenres(false); // Hide top genres when filter is applied
  };

  const handleClear = () => {
    setFilteredMovies(allMovies);
    setCurrentPage(1);
    setFilterApplied(false);
    setShowAllMovies(false);
    setShowTopGenres(true); // Show top genres when filter is cleared
  };

  const handleShowAllToggle = async () => {
    if (showAllMovies) {
      setShowAllMovies(false);
      setShowTopGenres(true); // Show top genres when toggled back to genres view
    } else {
      const all = await fetchAllMovies();
      if (Array.isArray(all)) {
        setAllMovies(all);
        setShowAllMovies(true);
        setShowTopGenres(false); // Hide top genres when showing all movies
      }
    }
  };

  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [, setLibraryMovies] = useState<Movie[]>([]);

  useEffect(() => {
    const loadLibraryMovies = async () => {
      const ids = ['s1', 's2', 's3', 's4'];
      const fetchedMovies = await Promise.all(ids.map((id) => getMovie(id)));
      const validMovies = fetchedMovies.filter(
        (movie): movie is Movie => movie !== null
      );
      setLibraryMovies(validMovies);
    };

    loadLibraryMovies();
  }, []);

  return (
    <div className="page-wrapper bg-dark text-white">
      {/* Improved navigation bar with better spacing */}
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center py-3 px-2">
          <Button
            variant="primary"
            onClick={handleShowAllToggle}
            className="me-2"
          >
            {showAllMovies ? 'Show Genres' : 'Show All'}
          </Button>

          <Button
            variant="outline-light"
            onClick={() => setShowFilter((prev) => !prev)}
          >
            <Search size={18} /> Search & Filter
          </Button>
        </div>
      </Container>

      <div className="py-3">
        {showFilter && (
          <div className="mb-4 px-4">
            <MovieFilterBar
              genres={Object.values(genreMap)}
              onFilterChange={handleFilterChange}
              onClear={handleClear}
            />
          </div>
        )}

        {/* Show Top Genres Section only when not filtering or showing all movies */}
        {showTopGenres && !filterApplied && !showAllMovies && (
          <TopGenresSection />
        )}

        {showAllMovies ? (
          <AllMoviesGrid
            movies={allMovies}
            onPosterClick={(movie) => setSelectedMovie(movie)}
          />
        ) : filterApplied ? (
          <>
            <MovieCarousel
              title="Filtered Movies"
              filter={(movie) =>
                currentItems.some((m) => m.showId === movie.showId)
              }
              movies={[]}
            />
            <div className="d-flex justify-content-center mt-4">
              <Paginator
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </>
        ) : (
          <>
            <LibraryRow onPosterClick={(movie) => setSelectedMovie(movie)} />
            {/* Add Recommendations at the top */}
            <RecommendedMovies allMovies={allMovies} />

            {Object.entries(genreMap).map(([key, label]) => (
              <GenreSection key={key} genreKey={key} label={label} />
            ))}
          </>
        )}
      </div>

      {/* Show Movie Details Modal */}
      {selectedMovie && (
        <MovieDetails
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onSelectMovie={(movie) => {
            setSelectedMovie(null);
            // Add a small delay to ensure smooth transition between modals
            setTimeout(() => {
              setSelectedMovie(movie);
            }, 100);
          }}
        />
      )}
    </div>
  );
};

export default MoviePage;
