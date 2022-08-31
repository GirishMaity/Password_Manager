import React, { createContext, useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Home from "./Pages/Home/Home";
import Login from "./Pages/Login/Login";
import Navbar from "./Components/Navbar/Navbar";
import Signup from "./Pages/SignUp/Signup";
import Passwords from "./Pages/Passwords/Passwords";
import Logout from "./Pages/Logout/Logout";
import { useSelector, useDispatch } from "react-redux";
import { setAuth, setName, setEmail, setPasswords } from "./redux/actions";
import { checkAuthenticated } from "./axios/instance";

export const ThemeContext = createContext(null);

function App() {
  const [theme, setTheme] = useState("dark");

  const toggleTheme = () => {
    setTheme((curr) => (curr === "light" ? "dark" : "light"));
  };

  const isAuthenticated = useSelector((state) => state.isAuthenticated);
  const dispatch = useDispatch();

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const res = await checkAuthenticated();

        if (res.status !== 200) {
          dispatch(setAuth(false));
        } else {
          const { name, email, passwords } = res.data;

          dispatch(setAuth(true));
          dispatch(setName(name));
          dispatch(setEmail(email));
          dispatch(setPasswords(passwords));
        }
      } catch (error) {
        console.log(error);
      }
    };
    verifyUser();
  }, [isAuthenticated, dispatch]);

  return (
    <ThemeContext.Provider value={(theme, toggleTheme)}>
      <div className="App" id={theme}>
        <Router>
          <Navbar />
          <label class="switch">
            <input
              type="checkbox"
              onChange={toggleTheme}
              defaultChecked={theme === "dark"}
            />
            <span class="slider"></span>
          </label>

          <Switch>
            <Route exact path="/">
              {" "}
              <Home />{" "}
            </Route>
            <Route exact path="/signin">
              {" "}
              <Login />{" "}
            </Route>
            <Route exact path="/signup">
              {" "}
              <Signup />{" "}
            </Route>
            <Route exact path="/passwords">
              {" "}
              <Passwords />{" "}
            </Route>
            <Route exact path="/logout">
              {" "}
              <Logout />{" "}
            </Route>
          </Switch>
        </Router>
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
