import React, { Component } from 'react';
import '../Sass/App.scss';
import firebase from '../firebase';
import PlayerSelect from './PlayerSelect';
import Summary from './Summary';

class App extends Component {

  // ======================
  // Constructor
  // ======================
  constructor() {
    super();
    this.state = {
      database: [],
      allPlayers: [],
      playerName: "",
      // playerAlias: "vchan",
      playerId: 0,
      position: "",
      allGames: [],
      totalGames: 0,
      currGame: "",
      currGameId: 0,
      currStats: {},
      userInput: ""
    }
  }

  // ======================
  // Component Did Mount
  // ======================
  componentDidMount() {
    const dbRef = firebase.database().ref();
    
    // Load up the entire database and reload when there are ANY updates
    dbRef.on('value', (data) => {
      const response = data.val();
      let players=[];

      console.log("This is the full database:", response);

      for (let key in response) {
        // Populate our full roster of players
        players.push(response[key].name);
        
        // Let's see if we can find a player name match
        if (response[key].name === this.state.playerName) {
          // Player found, let's store all the game history!
          const newPosition = response[key].position;
          const newGameState = response[key].games;

          // Populate our state with some initial information from the last game we had!
          const totalGames = newGameState.length;
          const newGameTitle = newGameState[totalGames - 1].title;
          const newGameId = totalGames - 1;
          const newStats = newGameState[totalGames - 1].stats;
    
          this.setState({
            playerId: key,
            position: newPosition,
            allGames: newGameState,
            totalGames: totalGames,
            currGame: newGameTitle,
            currGameId: newGameId,
            currStats: newStats
          });

        } // end if
      } // end for-in

      this.setState({
        database: response,
        allPlayers: players
      });

    });
  }

  // ======================
  // Player Select
  // ======================
  selectPlayer = (event) => {

    const db = [...this.state.database];
    for (let key in db) {
      
      // Let's see if we can find a player name match
      if (db[key].name === event.target.value) {
        // Player found, let's store all the game history!
        const newPosition = db[key].position;
        const newGameState = db[key].games;

        // Populate our state with some initial information from the last game we had!
        const totalGames = newGameState.length;
        const newGameTitle = newGameState[totalGames - 1].title;
        const newGameId = totalGames - 1;
        const newStats = newGameState[totalGames - 1].stats;
  
        this.setState({
          playerId: key,
          position: newPosition,
          allGames: newGameState,
          totalGames: totalGames,
          currGame: newGameTitle,
          currGameId: newGameId,
          currStats: newStats
        });

      } // end if
    } // end for-in

    this.setState({
      playerName: event.target.value,
      playerId: event.target.options.selectedIndex - 1
    });
  }

  // ======================
  // Handle Game Input Change
  // ======================
  handleChange = (event) => {
    this.setState({
      userInput: event.target.value
    });
  }

  // ======================
  // Add Game
  // ======================
  addGame = (event) => {
    event.preventDefault();
    const defaultStats = {
      assists: 0,
      blocks: 0,
      callahans: 0,
      catches: 0, 
      drops: 0,
      goals: 0,
      pulls: 0,
      stalls: 0,
      throwaways: 0,
      touches: 0
    };

    const dbRef = firebase.database().ref(`${this.state.playerId}/games`);

    // NTS: The child of the reference point is set to a number in order to keep the Array structure, if this is set to anything else, the app will break because Firebase will create its own key and turn the Array into an Object when using the simple .push() method
    dbRef.child(this.state.totalGames).set({
      title: this.state.userInput,
      stats: defaultStats
    });

    this.setState({
      userInput: '',
    });

  }

  // ======================
  // Display Stats Counter Section
  // ======================
  displayStatsTrack = () => {
    let tracker = [];
  
    for (let key in this.state.currStats) {
      tracker.push(
        <li key={key}>
          <button onClick={() => this.handleAdd(key)}> + </button>
          <p>{`${key}`}</p>
          <button onClick={() => this.handleSubtract(key)}> - </button>
        </li>
      );
    }

    return tracker;
  }

  // ======================
  // Add Stats
  // ======================
  handleAdd = (key) => {
    // Saving local copies of these values
    const value = this.state.currStats[key];
    const localStats = this.state.currStats;
    
    localStats[key] = value + 1;

    // Referencing a super specific spot to write this new stats object
    const dbRef = firebase.database().ref(`${this.state.playerId}/games/${this.state.currGameId}/stats`);

    // Anddd write it into Firebase
    dbRef.set(localStats);
  }

  // ======================
  // Subtract Stats
  // ======================
  handleSubtract = (key) => {
    const value = this.state.currStats[key];
    const localStats = this.state.currStats;
    
    if (value > 0) {
      localStats[key] = value - 1;

      // Referencing a super specific spot to write this new stats object
      const dbRef = firebase.database().ref(`${this.state.playerId}/games/${this.state.currGameId}/stats`);

      // Anddd write it into Firebase
      dbRef.set(localStats);
    }
  }

  // ======================
  // Render
  // ======================
  render () {
    return (
      <div className="App">
        <h1>Ultimistics Tracking App</h1>
        <div className="wrapper">
          <section className="info">
            <div className="playerInfo">

            <select onChange={this.selectPlayer} defaultValue={'DEFAULT'} >
              <option value="DEFAULT" disabled>Select a player</option>
              {
                this.state.allPlayers.map( (player, index) => {
                  return (
                    <PlayerSelect 
                      name={player} 
                      key={index} 
                    />
                  );
                })
              }
            </select>

              <h2>{this.state.playerName}</h2>
              <h3>Position: {this.state.position}</h3>
            </div>
    
            <div className="playerSummary">
              <div className="gameTitle">
                <h4>Game Summary</h4>
                <h5>Game Name: {this.state.currGame}</h5>
              </div>
              <table>
                <Summary summaryObject={this.state.currStats} />
              </table>
            </div>

            <div className="newGame">
              <form action="">
                <input 
                  type="text" 
                  onChange={this.handleChange}
                  value={this.state.userInput}
                  placeholder="Game Title" />
                <button onClick={this.addGame}>Add new game!</button>
              </form>
            </div>
          </section>
  
          <div className="counter">
            <section className="statsCounter">
              <ul>
                {this.displayStatsTrack()}
              </ul>
            </section>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
