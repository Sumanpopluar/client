import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import LoginForm from './template/login';
import UserRegistration from './template/registration';
import TeacherLandingPage from './components/TeacherLandingPage';
import StudentLandingPage from './components/StudentLandingPage';
import ClientLandingPage from './components/ClientLandingPage';  // Import ClientLandingPage
import CreateGroup from './components/CreateGroup';
import './App.css';  // Correct path to the CSS file



const App = () => {
  return (
    <div className='app'>
    <Router>
      <Switch>
        <Route path="/login" exact component={LoginForm} />
        <Route path="/register" component={UserRegistration} />
        <Route path="/teacher" component={TeacherLandingPage} />
        <Route path="/student" component={StudentLandingPage} />
        <Route path="/client" component={ClientLandingPage} /> {/* Route for ClientLandingPage */}
        <Route path="/" exact component={LoginForm} />
        <Route path="/create-group" component={CreateGroup} />
      </Switch>
    </Router>
    </div>
  );
};

export default App;
