/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // Game state refs to avoid closure issues in the loop
  const gameState = useRef({
    isJumping: false,
    score: 0,
    gameOver: false,
    character: {
      x: 100,
      y: 240,
      width: 50,
      height: 50,
      color: '#D2B48C', // Tan/Cookie color
      velocityY: 0,
      gravity: 0.6,
      jumpPower: -12,
      groundY: 240
    },
    rope: {
      x: 600,
      y: 265,
      width: 15,
      height: 25,
      color: '#8B0000', // Dark red rope
      speed: 6,
      initialSpeed: 6
    }
  });

  const jump = () => {
    if (gameState.current.gameOver) {
      resetGame();
      return;
    }
    if (!gameState.current.isJumping) {
      gameState.current.isJumping = true;
      gameState.current.character.velocityY = gameState.current.character.jumpPower;
    }
  };

  const resetGame = () => {
    gameState.current.gameOver = false;
    gameState.current.score = 0;
    gameState.current.rope.x = 600;
    gameState.current.rope.speed = gameState.current.rope.initialSpeed;
    gameState.current.character.y = gameState.current.character.groundY;
    gameState.current.character.velocityY = 0;
    gameState.current.isJumping = false;
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!gameStarted) {
          setGameStarted(true);
        } else {
          jump();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const drawPancakeCookie = (ctx: CanvasRenderingContext2D) => {
      const c = gameState.current.character;
      
      // Cape (Red)
      ctx.fillStyle = '#A52A2A';
      ctx.beginPath();
      ctx.roundRect(c.x - 5, c.y + 10, c.width + 10, c.height - 10, 10);
      ctx.fill();

      // Body/Face (Tan)
      ctx.fillStyle = '#F5DEB3';
      ctx.beginPath();
      ctx.arc(c.x + c.width / 2, c.y + c.height / 2, c.width / 2, 0, Math.PI * 2);
      ctx.fill();

      // Hood (Brown)
      ctx.fillStyle = '#8B4513';
      ctx.beginPath();
      ctx.arc(c.x + c.width / 2, c.y + c.height / 2 - 5, c.width / 2 + 2, Math.PI, 0);
      ctx.fill();
      
      // Hood Ears
      ctx.beginPath();
      ctx.moveTo(c.x + 5, c.y + 5);
      ctx.lineTo(c.x - 5, c.y - 10);
      ctx.lineTo(c.x + 15, c.y);
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(c.x + c.width - 5, c.y + 5);
      ctx.lineTo(c.x + c.width + 5, c.y - 10);
      ctx.lineTo(c.x + c.width - 15, c.y);
      ctx.fill();

      // Eyes (Purple)
      ctx.fillStyle = '#4B0082';
      ctx.beginPath();
      ctx.arc(c.x + 15, c.y + 25, 5, 0, Math.PI * 2);
      ctx.arc(c.x + 35, c.y + 25, 5, 0, Math.PI * 2);
      ctx.fill();

      // Mouth (Happy)
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c.x + c.width / 2, c.y + 35, 5, 0, Math.PI);
      ctx.stroke();
      
      // Syrup/Butter detail on top
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.roundRect(c.x + 15, c.y - 5, 20, 8, 2);
      ctx.fill();
    };

    const drawRope = (ctx: CanvasRenderingContext2D) => {
      const r = gameState.current.rope;
      ctx.fillStyle = r.color;
      ctx.fillRect(r.x, r.y, r.width, r.height);
      
      // Rope texture
      ctx.strokeStyle = '#DEB887';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(r.x + r.width / 2, r.y);
      ctx.lineTo(r.x + r.width / 2, r.y + r.height);
      ctx.stroke();
    };

    const update = () => {
      const state = gameState.current;
      if (state.gameOver) return;

      // Physics
      if (state.isJumping) {
        state.character.y += state.character.velocityY;
        state.character.velocityY += state.character.gravity;

        if (state.character.y >= state.character.groundY) {
          state.character.y = state.character.groundY;
          state.isJumping = false;
          state.character.velocityY = 0;
        }
      }

      // Rope movement
      state.rope.x -= state.rope.speed;
      
      if (state.rope.x + state.rope.width < 0) {
        state.rope.x = canvas.width;
        state.score += 10;
        setScore(state.score);
        state.rope.speed += 0.3;
      }

      // Collision
      const p = state.character;
      const r = state.rope;
      if (
        p.x < r.x + r.width &&
        p.x + p.width > r.x &&
        p.y < r.y + r.height &&
        p.y + p.height > r.y
      ) {
        state.gameOver = true;
        setGameOver(true);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Background sky (Warm morning)
      ctx.fillStyle = '#FFF9C4';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Ground
      ctx.fillStyle = '#D2B48C';
      ctx.fillRect(0, 290, canvas.width, 10);
      ctx.fillStyle = '#F5DEB3';
      ctx.fillRect(0, 285, canvas.width, 5);

      drawPancakeCookie(ctx);
      drawRope(ctx);
    };

    const gameLoop = () => {
      update();
      draw();
      if (!gameState.current.gameOver) {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameStarted, gameOver]);

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-4 font-sans text-slate-900 relative">
      <div className="absolute top-4 right-4 text-orange-900/60 font-bold text-sm bg-white/50 backdrop-blur px-3 py-1 rounded-full border border-orange-200">
        개발자 : 심유정
      </div>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-black tracking-tight mb-2 text-orange-600 drop-shadow-sm">
          🥞 팬케이크맛 쿠키의 줄넘기 🥞
        </h1>
        <p className="text-orange-800/60 font-medium">
          <span className="bg-orange-200 px-2 py-1 rounded text-orange-900 mx-1">스페이스바</span>를 눌러 점프하세요!
        </p>
      </motion.div>

      <div className="relative group">
        <canvas
          ref={canvasRef}
          width={600}
          height={300}
          className="bg-white border-4 border-orange-900/20 rounded-2xl shadow-2xl max-w-full h-auto"
          onClick={gameStarted ? jump : resetGame}
        />

        <AnimatePresence>
          {!gameStarted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-orange-900/20 rounded-2xl backdrop-blur-[2px]"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetGame}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-10 rounded-full shadow-lg text-xl transition-colors"
              >
                게임 시작
              </motion.button>
            </motion.div>
          )}

          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-orange-950/80 rounded-2xl text-white"
            >
              <h2 className="text-5xl font-black mb-4 text-orange-400">게임 종료</h2>
              <p className="text-2xl mb-8 font-bold">최종 점수: {score}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetGame}
                className="bg-white text-orange-900 font-bold py-3 px-10 rounded-full shadow-lg hover:bg-orange-100 transition-colors"
              >
                다시 도전
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute top-4 left-6">
          <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl border-2 border-orange-100 shadow-sm">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block">점수</span>
            <span className="text-2xl font-black text-orange-900 leading-none">{score}</span>
          </div>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl w-full">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-50 text-center">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-orange-600 font-bold">1</span>
          </div>
          <p className="text-sm font-medium text-slate-600">줄이 다가올 때까지 기다리세요</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-50 text-center">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-orange-600 font-bold">2</span>
          </div>
          <p className="text-sm font-medium text-slate-600">스페이스바를 눌러 줄을 넘으세요</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-50 text-center">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-orange-600 font-bold">3</span>
          </div>
          <p className="text-sm font-medium text-slate-600">10점마다 속도가 빨라집니다!</p>
        </div>
      </div>
    </div>
  );
}
