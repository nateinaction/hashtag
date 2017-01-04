import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk';
import React, { PropTypes } from 'react';
import { Provider, connect } from 'react-redux'
import { render } from 'react-dom';
import { PageHeader, Glyphicon, Modal, Button, Row, Col, Alert } from 'react-bootstrap';
import './index.scss';

/*
 * Example Object
 */
/*
{
	player: null || 'x' || 'o',
	turn: 'x' || 'o',
	gameStatus: null || 'win' || 'draw',
	gameBoard: [null, null, 'x',
							null, 'o', 'x',
							null, null, 'o']
}
*/

const gameBoardInitialState = () => {
	let blankBoard = [];
	for (var n = 1; n <= 9; n++) {
		blankBoard.push(null)
	}
	return blankBoard
}

/*
 * Redux Action Creators
 */

const setPlayer = (token) => ({
	type: 'SET_PLAYER',
	token
})

const setToken = (token, index) => ({
	type: 'SET_TOKEN',
	token,
	index
})

const tileClick = (index) => {
	return (dispatch, getState) => {
    const state = getState()
    let turn = state.turn
    let player = state.player
    let gameStatus = state.gameStatus
    let clickIndex = state.gameBoard[index]

    if (turn === player && gameStatus === null && clickIndex === null) {
    	return dispatch(setToken(player, index))
    }
	}
}

const setStatus = (gameStatus) => {
	let message = 'It looks like this game is a draw.'
	if (gameStatus !== 'draw') {
		message = 'It looks like ' + gameStatus + ' won this game.'
	}
	//console.log(gameStatus)

	return {
		type: 'SET_STATUS',
		message
	}
}

const reset = () => ({
	type: 'RESET'
})

/*
 * Redux Reducers
 */

const player = (state = null, action) => {
	switch (action.type) {
		case 'SET_PLAYER':
			return action.token
		case 'RESET':
			return null
		default:
			return state
	}
}

const turn = (state = 'x', action) => {
	switch (action.type) {
		case 'SET_TOKEN':
			return (state === 'x') ? 'o' : 'x'
		case 'RESET':
			return 'x'
		default:
			return state
	}
}

const gameStatus = (state = null, action) => {
	switch (action.type) {
		case 'SET_STATUS':
			return action.message
		case 'RESET':
			return null
		default:
			return state
	}
}

const gameBoard = (state = gameBoardInitialState(), action) => {
	switch (action.type) {
		case 'SET_TOKEN':
			return state.map((tile, index) => {
				if (index === action.index) {
					return action.token
				}
				return tile
			})
		case 'RESET':
			return gameBoardInitialState()
		default:
			return state
	}
}

const ticTacToeApp = combineReducers({
	player,
	turn,
	gameStatus,
	gameBoard
})

/*
 * Redux Store
 */

let store = createStore(ticTacToeApp, applyMiddleware(thunk))

/*
 * Redux state to console log
 */

console.log('initial state')
console.log(store.getState())
store.subscribe(() => console.log(store.getState()))

/*
 * Helper Fns
 */

const isEmpty = (currentGameBoard, index) => {
	return (currentGameBoard[index] === null)
}

const whichEmpty = (currentGameBoard, arr) => {
	return arr.filter((index) => isEmpty(currentGameBoard, index))
}

const chooseOutOf = (arr) => {
	let multiplier = arr.length
	let random = Math.floor(Math.random() * multiplier)
	return arr[random]
}

// count each item in the array
const countTokensInArr = (arr) => {
	let arrObjCount = {}
	arr.map((token) => {
		return arrObjCount[token] = arrObjCount[token] ? arrObjCount[token] + 1 : 1;
	})
	return arrObjCount
}

// using the current state of the gameboard, create a map of data about solutions
const solutionMap = (currentGameBoard) => {
	const solutions = [
		// horizontal wins
		[0,1,2],
		[3,4,5],
		[6,7,8],
		// vertical wins
		[0,3,6],
		[1,4,7],
		[2,5,8],
		// diaginal wins
		[0,4,8],
		[2,4,6]
	]
	return solutions.map((solution) => {
		let currentState = solution.map((location) => {
				return currentGameBoard[location]
			}).reduce(function(a, b) {
	  		return a.concat(b);
			}, [])
		let tokenCount = countTokensInArr(currentState)
		return {
			solution,
			currentState,
			tokenCount
		}
	})
}

// eliminate solutions that are no longer winnable
const winnableSolutions = (currentGameBoard) => {
	let possibleSolutions = solutionMap(currentGameBoard)
	return possibleSolutions.filter((solutionObj) => {
		// if tempArray contains both x's and o's then remove from possibleWins array
		let tokenCount = solutionObj.tokenCount
		return !(tokenCount.hasOwnProperty('x') && tokenCount.hasOwnProperty('o'))
	})
}

const findPrimaryToken = (tokenCount) => {
	return tokenCount.hasOwnProperty('x') ? 'x' : 'o'
}

// eliminate solutions that are no longer winnable
const enhancedSolutionMap = (currentGameBoard) => {
	let possibleSolutions = winnableSolutions(currentGameBoard)
	return possibleSolutions.map((solutionObj) => {
		// add primaryToken and score keys
		let tokenCount = solutionObj.tokenCount
		let primaryToken = null
		let score = 0

		if (tokenCount['null'] !== 3) {
			primaryToken = findPrimaryToken(tokenCount)
			score = tokenCount[primaryToken]
		}
		return Object.assign({}, solutionObj, {
			primaryToken,
			score
	  })
	})
}
//enhancedSolutionMap(thisGameBoard)

const checkForScore = (score, possibleSolutions) => {
	return possibleSolutions.filter((solution) => {
		return (solution.score === score)
	})
}

const checkForWins = (possibleSolutions) => {
	let win = checkForScore(3, possibleSolutions)
	return (win.length > 0) ? findPrimaryToken(win[0].tokenCount) : false
}

const checkForDraws = (possibleSolutions) => {
	let possibleSolutionsLength = possibleSolutions.length
	if (possibleSolutionsLength === 0) {
		return true
	}
	if (possibleSolutionsLength === 1 && possibleSolutions[0].score === 1) {
		return true
	}
	return false
}

const findNullSpot = (solutionObj) => {
	let location = solutionObj.currentState.indexOf(null)
	return solutionObj.solution[location]
}

const findTokenPossibleWins = (possibleSolutions, token) => {
	return checkForScore(2, possibleSolutions).filter((solutionsArr) => {
		return (solutionsArr.primaryToken === token)
	})
}

const findTokenPossibleMoves = (possibleSolutions, token) => {
	return checkForScore(1, possibleSolutions).filter((solutionsArr) => {
		return (solutionsArr.primaryToken === token)
	})
}

const findBestBlockingMove = (possibleSolutions, opponentToken) => {
	console.log(possibleSolutions)
	let arrObjCount = {}
	possibleSolutions.forEach((solutionsObj) => {
		solutionsObj.solution.forEach((location, index) => {
			if (solutionsObj.currentState[index] === null && solutionsObj.primaryToken === opponentToken) {
				arrObjCount[location] = arrObjCount[location] ? arrObjCount[location] + 1 : 1;
			}
		})
	})
	let move = Object.keys(arrObjCount).reduce(function(a, b){ return arrObjCount[a] > arrObjCount[b] ? a : b })
	console.log(arrObjCount, move)
	return parseInt(move, 10)
}

const chooseNextMove = (currentGameBoard, possibleSolutions, aiToken) => {

	// find any battles (score of 2) place token on your own skirmish but then on opponents
	let opponentToken = (aiToken === 'x') ? 'o' : 'x'
	let myPossibleWins = findTokenPossibleWins(possibleSolutions, aiToken)
	let opponentPossibleWins = findTokenPossibleWins(possibleSolutions, opponentToken)
	if (myPossibleWins.length > 0) {
		return findNullSpot(myPossibleWins[0])
	} else if (opponentPossibleWins.length > 0) {
		return findNullSpot(opponentPossibleWins[0])
	}

	// find any skirmishes (score of 1), rank the best moves
	let myPossibleMoves = findTokenPossibleMoves(possibleSolutions, aiToken)
	if (myPossibleMoves.length > 0) {
		let blockingMove = findBestBlockingMove(possibleSolutions, opponentToken)
		return blockingMove
	}

	// if opponent took a corner, take ...
	// tried: center, opposite corner, adjacent square, adjacent corner, opposite adjacent square
	if (!isEmpty(currentGameBoard, 0)) {
		return chooseOutOf([5, 7])
	} else if (!isEmpty(currentGameBoard, 2)) {
		return chooseOutOf([3, 7])
	} else if (!isEmpty(currentGameBoard, 6)) {
		return chooseOutOf([1, 5])
	} else if (!isEmpty(currentGameBoard, 8)) {
		return chooseOutOf([1, 3])
	}
	// if opponent took center, take a corner
	if (!isEmpty(currentGameBoard, 4)) {
		return chooseOutOf([0, 2, 6, 8])
	}
	// else take center
	return 4
}

const referee = (possibleSolutions) => {
	// check for draws
	let isDraw = checkForDraws(possibleSolutions)
	if (isDraw) {
		return store.dispatch(setStatus('draw'))
	}

	// check for wins
	let winningToken = checkForWins(possibleSolutions)
	if (winningToken) {
		return store.dispatch(setStatus(winningToken))
	}
}

const ai = (state, possibleSolutions) => {
	let player = state.player
	let currentGameBoard = state.gameBoard
	let aiToken = (player === 'x') ? 'o' : 'x'
	let aiPlay = chooseNextMove(currentGameBoard, possibleSolutions, aiToken)
  store.dispatch(setToken(aiToken, aiPlay))
}

store.subscribe(() => {
	let state = store.getState()
	if (state.gameStatus === null) {
		let possibleSolutions = enhancedSolutionMap(state.gameBoard)
		referee(possibleSolutions)
		if (state.player !== null && state.player !== state.turn) {
			ai(state, possibleSolutions)
		}
	}
})

/*
 * Minimax + alpha-beta
 */
var possibleBoards = {}
var minimax = (boardArray, token) => {
	let blankBoard = [null, null, null, null]
	boardArray = (boardArray) ? boardArray : blankBoard

	// switch token on fn start or initialize with x
	if (token === 'x') {
		token = 'o'
	} else if (token === 'o') {
		token = 'x'
	} else {
		token = 'x'
	}

	// for each null space index, place the turn token and recall minimax
	boardArray.forEach((thisToken, index) => {
		if (thisToken === null) {
			let tempArray = boardArray.map((item, thisIndex) => {
				if (index === thisIndex) {
					return token
				}
				return item
			})
			console.log(tempArray.join('-'))
			minimax(tempArray, token)
		}
	})

}
minimax()


/*
 * React Components
 */

const SelectXButton = (props) => (
	<Button
		bsStyle='primary'
		block
		onClick={() => props.onSetPlayer('x')} >
		Play as <Glyphicon glyph='remove' />
	</Button>
)
SelectXButton.propTypes = {
	onSetPlayer: PropTypes.func.isRequired
}

const SelectOButton = (props) => (
	<Button
		bsStyle='success'
		block
		onClick={() => props.onSetPlayer('o')} >
		Play as <Glyphicon glyph='unchecked' />
	</Button>
)
SelectOButton.propTypes = {
	onSetPlayer: PropTypes.func.isRequired
}

const SettingsModal = (props) => {
	let showModal = (props.player === null)
	return (
	  <Modal show={showModal}>
	    <Modal.Header>
	      <Modal.Title>Tic-Tac-Toe - New Game</Modal.Title>
	    </Modal.Header>
	    <Modal.Body>
	    	<p>Select your game token. <Glyphicon glyph='remove' /> plays first.</p>
	      <SelectXButton onSetPlayer={props.handleSetPlayer} />
	      <SelectOButton onSetPlayer={props.handleSetPlayer} />
	    </Modal.Body>
	  </Modal>
	)
}
SettingsModal.propTypes = {
	player: PropTypes.string,
	handleSetPlayer: PropTypes.func.isRequired
}

const GameBoard = (props) => (
	<div id='game-board'>
	{props.gameBoard.map((tile, index) => {
		let tileIcon = <span />
		if (tile === 'x') {
			tileIcon = <Glyphicon glyph='remove' />
		} else if (tile === 'o') {
			tileIcon = <Glyphicon glyph='unchecked' />
		}
		return (
			<div
				key={index}
				className='tile'
				onClick={() => props.handleTileClick(index)} >
				{tileIcon}
			</div>
		)
	})}
	</div>
)
GameBoard.propTypes = {
	gameBoard: PropTypes.array.isRequired,
	handleTileClick: PropTypes.func.isRequired
}

const Message = (props) => {
	if (props.message !== null) {
		return (
			<div>
				<Row>
					<Col xs={12} sm={8} smOffset={2} md={4} mdOffset={4}>
						<Alert bsStyle="info" onDismiss={() => props.handleResetClick()}>
		          <h4>{props.message}</h4>
		          <p>
		            <Button bsStyle="primary" onClick={() => props.handleResetClick()}>Try again?</Button>
		          </p>
		        </Alert>
					</Col>
				</Row>
			</div>
		)
	}
	return null
}
Message.propTypes = {
	message: PropTypes.string,
	handleResetClick: PropTypes.func.isRequired
}

/*
 * React-Redux Container Components
 */

const mapStateToProps = (state) => ({
	gameBoard: state.gameBoard
})

const mapDispatchToProps = (dispatch) => ({
	handleTileClick: (index) => {
		dispatch(tileClick(index))
	}
})

const GameBoardContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(GameBoard)

const mapStateToPropsTwo = (state) => ({
	player: state.player
})

const mapDispatchToPropsTwo = (dispatch) => ({
	handleSetPlayer: (token) => {
		dispatch(setPlayer(token))
	}
})

const SettingsModalContainer = connect(
	mapStateToPropsTwo,
	mapDispatchToPropsTwo
)(SettingsModal)

const mapStateToPropsThree = (state) => ({
	message: state.gameStatus
})

const mapDispatchToPropsThree = (dispatch) => ({
	handleResetClick: (token) => {
		dispatch(reset())
	}
})

const MessageContainer = connect(
	mapStateToPropsThree,
	mapDispatchToPropsThree
)(Message)

/*
 * React Root Component
 */

const App = (props) => (
	<div id='App'>
		<PageHeader>Tic-Tac-Toe <small> with React & Redux</small></PageHeader>
		<MessageContainer />
		<SettingsModalContainer />
		<GameBoardContainer />
	</div>
)

/*
 * React Dom
 */

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
