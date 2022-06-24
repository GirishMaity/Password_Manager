import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import { useSelector } from "react-redux";

function Home() {
  const { name, isAuthenticated } = useSelector((state) => state);

  return (
    <div className="home">
      {!isAuthenticated ? (
        <div className="home__left">
          <h1>
            {" "}
            Welcome to <span className="name"> Password Manager </span>{" "}
          </h1>

          <Link to="/signup"> SignUp Now </Link>
        </div>
      ) : (
        <div className="home__left">
          <h1>
            {" "}
            Welcome <span className="name"> {name} </span>{" "}
          </h1>

          <Link to="/passwords"> See your passwords </Link>
        </div>
      )}
    </div>
  );
}

export default Home;
