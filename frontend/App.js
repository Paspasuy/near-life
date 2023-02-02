import 'regenerator-runtime/runtime'
import React from 'react'

import './assets/css/global.css'

import {login, logout, create_board, get_board, step} from './assets/js/near/utils'
import getConfig from './assets/js/near/config'

/*
const gamesSlice = createSlice({
  name: 'games',
  initialState: {
    games: []
  },
  reducers: {
    incremented: state => {
      state.value += 1
    },
    decremented: state => {
      state.value -= 1
    }
  }
})
export const { incremented, decremented } = counterSlice.actions
const store = configureStore({
  reducer: counterSlice.reducer
})
store.subscribe(() => console.log(store.getState()))
store.dispatch(incremented())
store.dispatch(incremented())
store.dispatch(decremented())
*/

export default function App() {
  const [buttonDisabled, setButtonDisabled] = React.useState(true)
  const [showNotification, setShowNotification] = React.useState(false)

/*  const setId = (i) => {
    if (i >= 0) {
      setBoardId(i);
      getBoard(i);
    }
  };*/
  // The useEffect hook can be used to fire side-effects during render
  // Learn more: https://reactjs.org/docs/hooks-intro.html
  // React.useEffect(() => {getBoard(boardId)},
    // The second argument to useEffect tells React when to re-run the effect
    // Use an empty array to specify "only run on first render"
    // This works because signing into NEAR Wallet reloads the page
    // []
  // )
  // if not signed in, return early with sign-in prompt
  if (!window.walletConnection.isSignedIn()) {
    return (
      <main>
        <h1> GAME OF LIFE </h1>
        <p style={{ textAlign: 'center' }}>Sign in with your NEAR wallet and play!</p>
        <p style={{ textAlign: 'center', marginTop: '1.5em' }}>
          <button className="normal" onClick={login}>Sign in</button>
        </p>
      </main>
    )
  }

  return (
    <>
      <button className="link" style={{ float: 'right' }} onClick={logout}>
        Sign out
      </button>
      <main>
        <h1> GAME OF LIFE </h1>
        
        <Game />

      </main>
      <div className="footer">
        <p>made by I_love_geom</p>
      </div>
    </>
  )
}

class GameData {
  constructor(boardId) {
    this.history = [];
    this.boardId = boardId;
    this.index = -1;
  }
    // "BAAIAA4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
/*    this.index = 0;
    this.history = [decode("BAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")];
*/
}

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      games: [new GameData(0)],
      boardId: 0,
      showNotification: false,
    }
  }

  UNSAFE_componentWillMount() {
    this.fetchBoard();
  }

  plusBoardId() {
    const bid = this.state.boardId;
    if (bid + 1 >= this.state.games.length) {
      this.state.games.push(new GameData(bid));
      this.state.boardId = bid + 1;
      this.fetchBoard();
    } else {
      this.setState({ 
        boardId: bid + 1
      })
    } 
 }

  minusBoardId() {
    if (this.state.boardId > 0) {
      this.setState({boardId: this.state.boardId - 1})
    }
  }

  prevMove() {
    const bid = this.state.boardId;
    if (this.state.games[bid].index > 0) {
      let newGames = JSON.parse(JSON.stringify(this.state.games));
      newGames[bid].index -= 1;
      this.setState({
        games: newGames,
      })
    }
  }

  async nextMove() {
    const bid = this.state.boardId;
    if (this.state.games[bid].index + 1 < this.state.games[bid].history.length) {
      let newGames = JSON.parse(JSON.stringify(this.state.games));
      newGames[bid].index += 1;
      this.setState({
        games: newGames,
      })
    } else {
      this.setState({showNotification: true});
      console.log("waiting step...");
      await step(bid);
      console.log("done!");
      this.fetchBoard();
      this.setState({showNotification: false});
    }
  }

  async fetchBoard() {
    let newGames = JSON.parse(JSON.stringify(this.state.games));
    const bid = this.state.boardId;
    const g = this.state.games[bid];
    console.log("waiting get board...");
    let st = await get_board(bid);
    console.log("done!");
      // .then(st => {
        if (st != null) {
          if (g.history == 0 ||
              g.history[g.history.length - 1].current_block_height 
              != st.current_block_height) {
          // newGames[bid].index = 0;
          // newGames[bid].history = [decode("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")];
            newGames[bid].index = g.history.length;
            newGames[bid].history.push(decode(st.board.field));
          }
        } else {
          newGames[bid].index = 0;
          newGames[bid].history = [decode("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")];
        }
      // });
    // console.log("setting state! ", newGames);
    this.setState({
      games: newGames,
    })
  }

  getAlive() {
    return getAlive(this.state.games[this.state.boardId].history[this.state.games[this.state.boardId].index])
  }

  render() {
    // console.log("rendering!");
    // console.log(this.state.boardId);
    // console.log(this.state.games[this.state.boardId]);
    return (
      <>
      <div style={{ display: 'flex' }}>
        <div>
          <Field field={
            this.state.games[this.state.boardId]
            .history[this.state.games[this.state.boardId].index]
          } />
          <div className="buttons">
            <button
              className="normal"
              onClick={this.prevMove.bind(this)}
              disabled={this.state.games[this.state.boardId].index == 0} 
            >◀</button>
            <button className="normal"
              style={{ marginLeft: '1em' }}
              onClick={this.nextMove.bind(this)}
              disabled={this.state.showNotification && 
              this.state.games[this.state.boardId].index + 1 == this.state.games[this.state.boardId].history.length}
            > {this.state.games[this.state.boardId].index + 1 == this.state.games[this.state.boardId].history.length ? "Next": "▶"}
            </button>
          </div>
        </div>
        <div className="left">
          <p><b>Wallet: </b><code>{window.accountId}</code></p>
          <p><b>Board ID: </b>
            <button className="link" onClick={this.minusBoardId.bind(this)}>−</button>
            <code>{this.state.boardId}</code>
            <button className="link" onClick={this.plusBoardId.bind(this)}>+</button>
          </p>
          <p><b>Step: </b><code>{this.state.games[this.state.boardId].index}</code></p>
          <p><b>Alive cells: </b><code>{getAlive(this.state.games[this.state.boardId].history[this.state.games[this.state.boardId].index])}</code></p>
        </div>
      </div>
      {this.state.showNotification && <Notification />}</>
    )
  }
}

class Field extends React.Component {
  get(i) {
    if (this.props.field == undefined) {
      return "^";
    }
    const byteIndex = Math.floor(i / 8);
    const bitIndex = Math.floor(i % 8);
    return (this.props.field[byteIndex] >> bitIndex) & 1 ? "■": ".";
  }
  render() {
    // console.log("rendering field: ", this.props.field);
    return (
      <tbody>
        {[...Array(20)].map((x, i) => <tr key={i}>
          {[...Array(20)].map((y, j) =>
            <code key={i*20+j}> {this.get(i*20+j)} </code>
          )}
        </tr>)}
      </tbody>
    );
  }
}

// this component gets rendered by App after the form is submitted
function Notification() {
  const { networkId } = getConfig(process.env.NODE_ENV || 'development')
  const urlPrefix = `https://explorer.${networkId}.near.org/accounts`

  return (
    <aside>
      <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.accountId}`}>
        {window.accountId}
      </a>
      {' '/* React trims whitespace around tags; insert literal space character when needed */}
      called method: 'step' in contract:
      {' '}
      <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.contract.contractId}`}>
        {window.contract.contractId}
      </a>
      <footer>
        <div>◷ Waiting</div>
        <div>Just now</div>
      </footer>
    </aside>
  )
}

function decode(s) {
  if (s == null) {
    return new Uint8Array(10*5).fill(0);
  }
  return Uint8Array.from(atob(s), c => c.charCodeAt(0)); 
}
function getAlive(field) {
  var ans = 0;
  for (var n in field) {
    var num = field[n];
    while (num > 0) {
      ans += (num & 1);
      num >>= 1;
    }
  }
  return ans;
}