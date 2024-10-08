const API_KEY = "73eb6fcfb83f1d3647cf4aa1a142e4fe";
const IMG_PATH = "https://image.tmdb.org/t/p/w1280";
const BASE_API_URL = "https://api.themoviedb.org/3/discover/movie?";
const PAGE_LIMIT = 3; // Number of pages to fetch
const CAST_API_URL = "https://api.themoviedb.org/3/movie"; // Base URL for fetching cast

const main = document.getElementById("main");
const nextMovieButton = document.getElementById("next-movie");

let movies = []; // Array to store the list of movies
let shuffledMovies = []; // Array to store shuffled list of movies
let currentIndex = 0; // Index to keep track of the current movie

document.addEventListener("DOMContentLoaded", function() {
    const canvas = document.getElementById("canvas");
    const logoScreen = document.getElementById('logo-screen');
    const riveAnimation = new rive.Rive({
        src: "LOGO.riv",
        canvas: canvas,
        autoplay: true,
        onError: (error) => {
            console.error("Error loading Rive animation:", error);
        }
    });

    // Simulate loading time
    setTimeout(() => {
        // Trigger the move-to-top-left animation by adding the class
        logoScreen.classList.add('move-to-top-left');

        // After the transition completes (1 second), you can show the main content
        setTimeout(() => {
            document.getElementById("main").style.display = 'block';  // Show main content
            document.getElementById("main").classList.add('fade-in'); // Optional: Add fade-in effect
        }, 500);  // 1 second for the move transition
    }, 3000);  // Adjust the initial loading time (4 seconds in this case)
});



// Fetch movies from multiple pages
async function fetchMovies() {
    try {
        let allMovies = [];
        for (let page = 1; page <= PAGE_LIMIT; page++) {
            const url = `${BASE_API_URL}api_key=${API_KEY}&language=en-US&sort_by=vote_average.asc&primary_release_date.gte=1980-01-01&primary_release_date.lte=1989-12-31&vote_average.lte=5&vote_count.gte=10&include_adult=false&page=${page}`;
            const res = await fetch(url);
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const data = await res.json();
            if (data.results) {
                allMovies = allMovies.concat(data.results);
            } else {
                console.error('No results found');
            }
        }
        movies = allMovies;
        shuffleMovies();
        displayNextMovie();
    } catch (error) {
        console.error('Error fetching movies:', error);
        main.innerHTML = "<p>Failed to load movies. Please try again later.</p>";
    }
}

// Shuffle the movies array
function shuffleMovies() {
    shuffledMovies = movies.slice(); // Create a copy of the movies array
    for (let i = shuffledMovies.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledMovies[i], shuffledMovies[j]] = [shuffledMovies[j], shuffledMovies[i]]; // Swap elements
    }
    currentIndex = 0; // Reset index
}

// Fetch and display the next movie in the shuffled list
function displayNextMovie() {
    if (shuffledMovies.length === 0) return;

    if (currentIndex >= shuffledMovies.length) {
        shuffleMovies(); // Shuffle again if we reach the end
    }

    const movie = shuffledMovies[currentIndex];
    const { id, title, poster_path, vote_average, overview } = movie;

    main.innerHTML = `
        <div class="movie">
            <img src="${IMG_PATH + poster_path}" alt="${title}">
            <div class="movie-info">
                <h3>${title}</h3>
                <span>${vote_average}</span>
            </div>
            <div class="overview">
                <h3>Overview</h3>
                ${overview}
            </div>
            <div id="cast-info">
                <h3>Cast</h3>
                <p>Loading cast...</p>
            </div>
        </div>
    `;

    fetchMovieCast(id); // Fetch and display the cast for this movie

    currentIndex++;
}

// Fetch the cast for a specific movie by its ID
async function fetchMovieCast(movieId) {
    try {
        const castUrl = `${CAST_API_URL}/${movieId}/credits?api_key=${API_KEY}&language=en-US`;
        const res = await fetch(castUrl);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        displayCast(data.cast);
    } catch (error) {
        console.error('Error fetching cast:', error);
        document.getElementById('cast-info').innerHTML = "<p>Failed to load cast. Please try again later.</p>";
    }
}

// Display the cast in the movie element
function displayCast(cast) {
    const castInfo = document.getElementById('cast-info');
    castInfo.innerHTML = "<h3>Cast</h3>";

    if (cast.length > 0) {
        cast.slice(0, 5).forEach((actor) => { // Display the top 5 cast members
            const castElement = document.createElement("p");
            castElement.textContent = `${actor.name} as ${actor.character}`;
            castInfo.appendChild(castElement);
        });
    } else {
        castInfo.innerHTML = "<p>No cast information available</p>";
    }
}

function cacheMovies() {
    localStorage.setItem('movies', JSON.stringify(movies));
}

function loadCachedMovies() {
    const cachedMovies = localStorage.getItem('movies');
    if (cachedMovies) {
        movies = JSON.parse(cachedMovies);
        shuffleMovies();
        displayNextMovie();
    } else {
        fetchMovies(); // Fetch if no cache exists
    }
}

window.addEventListener('load', loadCachedMovies);

let prefetching = false;

function displayNextMovie() {
    const movieContainer = document.getElementById("movie-container");

    // Add the fade-out class for the transition
    movieContainer.classList.add("fade-out");

    // Wait for the next frame to ensure the fade-out applies before changing the content
    requestAnimationFrame(() => {
        setTimeout(() => {
            if (shuffledMovies.length === 0) return;

            if (currentIndex >= shuffledMovies.length) {
                shuffleMovies(); // Shuffle again if we reach the end
            }

            const movie = shuffledMovies[currentIndex];
            const { id, title, poster_path, vote_average, overview } = movie;

            // Update movie content
            movieContainer.innerHTML = `
                <div class="movie">
                    <img data-src="${IMG_PATH + poster_path}" alt="${title}" class="lazy-image">
                    <div class="movie-info">
                        <h3>${title}</h3>
                        <span>${vote_average}</span>
                    </div>
                    <div class="overview">
                        <h3>Overview</h3>
                        ${overview}
                    </div>
                    <div id="cast-info">
                        <h3>Cast</h3>
                        <p>Loading cast...</p>
                    </div>
                </div>
            `;

            // Lazy load the images
            lazyLoadImages();

            // Fetch and display the cast for this movie
            fetchMovieCast(id);

            // Trigger fade-in after the content is updated
            movieContainer.classList.remove("fade-out");

            currentIndex++;
        }, 500); // Delay matches the CSS transition time (500ms)
    });
}



function lazyLoadImages() {
    const lazyImages = document.querySelectorAll('.lazy-image');
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.getAttribute('data-src');
                img.classList.remove('lazy-image');
                observer.unobserve(img);
            }
        });
    });

    lazyImages.forEach(image => observer.observe(image));
}


// Event listener for the "Next Movie" button
nextMovieButton.addEventListener("click", displayNextMovie);

// Fetch the movies on page load
fetchMovies();


