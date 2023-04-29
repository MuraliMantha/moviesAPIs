const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running");
    });
  } catch (e) {
    console.log(`Error msg: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

const convertDbObjectToDirectorObject = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

//get movienames
app.get("/movies/", async (request, response) => {
  const getMovies = `SELECT movie_name FROM movie ORDER BY movie_id;`;
  const movieArray = await db.all(getMovies);
  response.send(
    movieArray.map((eachMovie) => convertDbObjectToResponseObject(eachMovie))
  );
});

// creat movie
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovie = `
    INSERT INTO movie (director_id,movie_name,lead_actor)
    VALUES
    (
       "${directorId}","${movieName}","${leadActor}"
    );`;

  const dbresponse = await db.run(addMovie);
  const movieId = dbresponse.lastID;
  response.send("Movie Successfully Added");
});

//get movie
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovie = `
    SELECT * FROM movie WHERE movie_id = ${movieId};`;
  const dbresponse = await db.get(getMovie);
  response.send(convertDbObjectToResponseObject(dbresponse));
});

// update movie
app.put("/movies/:movieId/", async (request, response) => {
  const movieDetails = request.body;
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovie = `
    UPDATE movie SET 
  
        director_id="${directorId}",
        movie_name="${movieName}",
        lead_actor="${leadActor}"
        
        WHERE movie_id = ${movieId};`;

  const dbresponse = await db.run(updateMovie);
  response.send("Movie Details Updated");
});

//Delete movie
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovie = `
    DELETE FROM movie WHERE movie_id = ${movieId};`;
  const dbresponse = await db.get(deleteMovie);
  response.send("Movie Removed");
});

//get movienames
app.get("/directors/", async (request, response) => {
  const getdirectors = `SELECT * FROM director ORDER BY director_id;`;
  const movieDirectorArray = await db.all(getdirectors);
  response.send(
    movieDirectorArray.map((eachMovie) =>
      convertDbObjectToDirectorObject(eachMovie)
    )
  );
});

//get movie directorname
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;

  const getDirectorMovie = `
    SELECT movie.movie_name AS movieName
    FROM movie INNER JOIN director ON
    movie.director_id = director.director_id
    WHERE director.director_id = ${directorId}
    GROUP BY movie.movie_id`;
  const dbresponse = await db.all(getDirectorMovie);
  response.send(dbresponse);
});

module.exports = app;
