
import './App.css'
import React, { useEffect,useState } from 'react'
import { useDebounce } from 'react-use'
import Search from './components/Search'
import Spinner from './components/Spinner';
import MovieCard from './components/MovieCard';
import { getTrendingMovies, updateSearchCount } from './appwrite';

// perma variables

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

// App component

const App = () => {

  // states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [movieList, setMovieList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [trendingMovies, setTrendingMovies] = useState([]);
  
  //debounce search term to optimize API calls
  // wait time 700ms
  useDebounce(()=>setDebouncedSearchTerm(searchTerm),700,[searchTerm])

  // a function to fetch movies from the database

  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMessage(null);

    //try block to get the movies

    try {
      const endpoint = query
      ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
      : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc` ;
      const response = await fetch(endpoint, API_OPTIONS);
      
      // Error if connection is invalid
      if(!response.ok){
        throw new Error("Failed to connect!");
      }

      // Write the response data 
      const data=await response.json();

      // Error if response data doesnt exist
      if(data.Response === 'False'){
        setErrorMessage(data.Error || 'Failed to fetch movies');
        setMovieList([]);
        return;
      }
      
      // Asign the results to state 
      setMovieList(data.results || []);
      
      if(query && data.results.length>0){
        await updateSearchCount(query,data.results[0]);
      }

    } catch (error) { //if try fails in any part, error displayed here.
      console.error(`Error fetching movies: ${error}`);
      setErrorMessage('Error fetching movies. Please try again later.');
    }
    finally{
      setIsLoading(false);
    }
  }

  // trending movies function

  const loadTrendingMovies = async () => {
    try {

      const movies = await getTrendingMovies();

      setTrendingMovies(movies);
      
    } catch (error) {
      console.log(`Error fetching Trending ${error}`);
      
    }
  }

  // Call fetchMovies when the component is mounted.
  useEffect(() => {
    fetchMovies(searchTerm);  
    }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  }, [])
    

  return (
    <main>
      <div className = "pattern"/> 

      <div className="wrapper">
        <header>
          <img src='./hero.png' alt='Hero Banner'/>
          <h1>
            Find <span className="text-gradient">Trending</span> Movies You'll Enjoy
          </h1>
        <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {trendingMovies.length>0 && (
          <section className='trending'>
            <h2> Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie, index)=>(
                <li key={movie.$id}>
                  <p>{index+1}</p>
                  <img src={movie.poster_url} alt={movie.title}/>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className='all-movies'>

          <h2 > All Movies</h2>
          
          {isLoading ?(
            <Spinner/>
          ) : errorMessage ? (
            <p className='text-red-500'>{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie)=>(
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}

        </section>

      </div>

    </main>
  )
}
export default App
