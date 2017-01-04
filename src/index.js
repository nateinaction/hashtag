/*
 * Minimax // + alpha-beta
 */
const solutionMap = (gameBoard) => {
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
 		return solution.map((index) => {
 				return gameBoard[index]
 			}).reduce(function(a, b) {
 	  		return a.concat(b);
 			}, [])
 	})
}
var blankBoard = () => (
	//Array(9).fill(null)
	['x', null, null, null, 'o', null, null, null, null]
)
var nextTurn = (currentTurn) => (
	currentTurn === 'x' ? 'o' : 'x'
)
var count = 0
var generateNewBoard = (maximizingToken, boardArray, turn) => {
	// for each null space index, place the turn token and recall minimax
	boardArray.forEach((thisSpace, index) => {
		if (thisSpace === null) {
			let tempArray = boardArray.map((item, thisIndex) => {
				if (index === thisIndex) {
					return turn
				}
				return item
			})
			count += 1
			console.log(tempArray.join('-'), count)

			// switch turn on fn start or initialize with x
			turn = nextTurn(turn)

			// increase depth
			minimax(maximizingToken, tempArray, turn)
		}
	})
}
var boardTree = {}
var minimax = (maximizingToken, boardArray, turn) => {
	// initialize vars
	boardArray = boardArray ? boardArray : blankBoard()
	turn = turn ? turn : 'x'

	// calculate tree depth
	let depth = 9 - boardArray.filter(token => token === null).length

	// first winning move is only possible depth = 4
	if (depth >= 4) {
		// create a map of all solutions with current boardArray
		let boardMap = solutionMap(boardArray)
		// fill an array with any wins
		let win = boardMap.filter(solution => (
			!!solution.reduce((a, b) => (a === b ? a : NaN))
		))
		if (win.length > 0) {
			console.log('winner')
		} else {
			generateNewBoard(maximizingToken, boardArray, turn)
		}
	} else {
		generateNewBoard(maximizingToken, boardArray, turn)
	}
}
minimax('x', blankBoard(), 'x')
