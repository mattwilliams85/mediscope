import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Motion, spring } from 'react-motion'

import BoardButtons from './Buttons'
import Layers from './Layers'

import TilesCtrl from '../../controllers/tiles'
import { playWord, addActiveTile, clearActiveTiles } from '../../actions/game'
import { strPossession } from '../../helpers'

class Board extends Component {
  constructor (props) {
    super(props)
    this.handleMouseUp = this.handleMouseUp.bind(this)

    this.state = {
      hoverEvents: false,
      tiles: [],
      previousTile: {},
      word: [],
      activeTiles: {},
      tally: 0,
      wrong: false,
      start: true
    }
  }

  componentDidMount () {
    window.addEventListener('mouseup', this.handleMouseUp)
    setTimeout(() => {
      this.setState({start: false})
    }, 800)
  }

  componentWillUnmount () {
    window.removeEventListener('mouseup', this.handleMouseUp)
    clearInterval(this.timer)
  }

  componentWillReceiveProps (nextProps, nextState) {
    if (this.props.playerTurn !== nextProps.playerTurn) {
      this.setState({updating: true})
      setTimeout(() => {
        this.setState({updating: false})
      }, 750)
    }
  }

  getScore () {
    return this.props.players[this.props.user].life
  }

  getPlayer (num) {
    let arr = Object.keys(this.props.players)
    let player = this.props.players[arr[num]]
    if (!player) return {life: '---'}
    player.displayName = arr[num]
    return player
  }

  handleMouseDown (tile) {
    this.pushTile(tile)

    this.setState({hoverEvents: true, previousTile: tile})
  }

  handleMouseUp () {
    let spelledWord = this.state.word.join('')

    if (TilesCtrl.validateWord(spelledWord) && !this.isDisabled()) {
      this.setState({updating: true})
      this.props.playWord(spelledWord, this.state.activeTiles, this.state.tally)
    } else {
      this.props.clearActiveTiles()
      this.setState({wrong: true})
    }
    setTimeout(() => {
      this.setState({hoverEvents: false, word: [], activeTiles: {}, tally: 0, wrong: false})
    }, 70)
  }

  handleMouseOver (tile) {
    if (!this.state.hoverEvents) return
    if (this.state.activeTiles[tile.id]) return
    if (this.state.word.length > 18) return
    let prev = this.state.previousTile
    if (
      tile.x > prev.x + 1 ||
      tile.x < prev.x - 1 ||
      tile.y > prev.y + 1 ||
      tile.y < prev.y - 1
    ) return
    this.pushTile(tile)
  }

  turnMsg () {
    let opponent
    let player1 = this.getPlayer(0).displayName
    let player2 = this.getPlayer(1).displayName

    if (player1 === this.props.user) {
      opponent = player2
    } else {
      opponent = player1
    }
    if (!player2) return 'Waiting for Player...'
    if (this.isDisabled()) return strPossession(opponent) + ' move'
    return 'Your move!'
  }

  pushTile (tile) {
    this.props.addActiveTile(tile)
    this.addToActiveTiles(tile)
    this.addToWord(tile.character)
    this.addToTally(tile.score)
    this.setState({previousTile: tile})
  }

  addToActiveTiles (tile) {
    let newActive = {}
    newActive[tile.id] = tile
    let activeTiles = Object.assign({}, this.state.activeTiles, newActive)
    this.setState({activeTiles: activeTiles})
  }

  addToWord (character) {
    this.setState({word: [...this.state.word, character]})
  }

  addToTally (score) {
    let tally = this.state.tally
    this.setState({tally: tally + score})
  }

  tileClasses (tile) {
    let name = ''
    if (tile.shifted && this.state.updating) name += ` shifted-${tile.shifted}`
    if (this.state.activeTiles[tile.id] && !this.state.updating) name += ' active'
    if (this.state.activeTiles[tile.id] && this.state.wrong) name += ' wrong'
    if (this.props.activeTiles[tile.id] && !this.state.updating) name += ' opponent-active'
    if (this.state.start) name += ' start'
    return name
  }

  isWrong (key) {
    if (this.state.wrong && this.state.activeTiles[key]) return true
  }

  isDisabled () {
    let user = this.props.user
    let players = Object.keys(this.props.players)
    let playerTurn = this.props.playerTurn

    if (players[playerTurn] !== user || players.length < 2) return 'disabled'
  }

  isGameover () {
    return this.props.winner ? 'game-over' : 'hide'
  }

  isSinglePlayer () {
    if (Object.keys(this.props.players).length < 2) return 'single'
  }

  letterSize () {
    if (this.state.word.length > 13) return '17pt'
    if (this.state.word.length > 11) return '20pt'
    if (this.state.word.length > 9) return '25pt'
    if (this.state.word.length > 7) return '30pt'
    return '35pt'
  }

  render () {
    return (
      <div className={`${this.isDisabled()} ${this.isSinglePlayer()} board-wrap`}>

        <div className={`${this.isGameover()} layout-column layout-align-center-center`}>
          <h1>GAME OVER <br />{this.props.winner} WON!</h1>
        </div>

        <div className='letters-wrap layout-row layout-align-center-center'>
          <div className='letters' style={{fontSize: this.letterSize()}}>
            { this.state.word.map((letter, index) => {
              return (<span key={index}>{letter}</span>)
            })}
          </div>
          <div className={this.state.tally ? 'points' : 'hide'}>+{this.state.tally}</div>
        </div>

        <Layers />

        <div className='turn-wrap'>
          <div className='player-life p1'>{this.getPlayer(0).life} <span>HP</span></div>
          <div className='player-life p2'>{this.getPlayer(1).life} <span>HP</span></div>
          <div className='turn'>Turn {this.props.turnCount}</div>
        </div>

        <div className='turn-msg'>{this.turnMsg()}</div>

        <div className='tile-wrap'>
          { this.props.tileArray.map(tile => {
            return (
              <Motion style={{x: spring(this.isWrong(tile.id) ? 30 : 0, {stiffness: 750, damping: 7, precision: 0.1})}} key={tile.id}>
                {({x}) =>
                  <div
                    className={`x${tile.x} y${tile.y} ${this.tileClasses(tile)} tile`}
                    onMouseDown={this.handleMouseDown.bind(this, tile)}
                    style={{
                      WebkitTransform: `translate3d(${x}px, 0, 0)`,
                      transform: `translate3d(${x}px, 0, 0)`
                    }}>
                    <div
                      className='hover-box'
                      onMouseOver={this.handleMouseOver.bind(this, tile)}
                      value={tile.character} />
                    <span className='character'>{tile.character}</span>
                    <span className='score'>{tile.score}</span>
                  </div>
                }
              </Motion>
            )
          }) }
        </div>

        <div className='background layer-1' />

        <BoardButtons />

      </div>
    )
  }
}

const mapStateToProps = (state) => {
  let game = state.games.selected
  return {
    game: game,
    user: state.currentUser.displayName,
    players: game.players,
    playerTurn: game.playerTurn,
    turnCount: game.turnCount,
    tally: game.tally,
    winner: game.winner,
    tiles: game.tiles,
    activeTiles: game.activeTiles,
    tileArray: Object.keys(game.tiles).map(function (key) { return game.tiles[key] })
  }
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({playWord, addActiveTile, clearActiveTiles}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Board)
