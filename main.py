from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).with_name("leaderboard.db")
app = FastAPI(title="Reverse Mario Leaderboard API", version="1.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False,
                   allow_methods=["*"], allow_headers=["*"])

def connect():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con

def init_db():
    with connect() as con:
        con.execute("""CREATE TABLE IF NOT EXISTS players (
            name TEXT PRIMARY KEY COLLATE NOCASE,
            score INTEGER NOT NULL DEFAULT 0,
            games INTEGER NOT NULL DEFAULT 0
        )""")
        if con.execute("SELECT COUNT(*) FROM players").fetchone()[0] == 0:
            con.executemany("INSERT INTO players(name,score,games) VALUES(?,?,?)", [
                ("PixelPro",2450,18),("MarioMaster",2300,21),("SkyRunner",2100,14),
                ("Leafy",1400,9),("BlockBuster",1250,12),("CoinChaser",980,7),("JumpKing",820,11)
            ])
init_db()

class ScoreSubmission(BaseModel):
    name: str = Field(min_length=1, max_length=20)
    score: int = Field(ge=0, le=999999)

@app.get("/")
def root(): return {"message":"Reverse Mario Leaderboard API","docs":"/docs"}
@app.get("/health")
def health(): return {"status":"ok"}
@app.get("/leaderboard")
def leaderboard():
    with connect() as con:
        rows=con.execute("SELECT name,score,games FROM players ORDER BY score DESC,name COLLATE NOCASE ASC").fetchall()
    return [dict(r) for r in rows]
@app.post("/scores")
def submit_score(payload: ScoreSubmission):
    name=" ".join(payload.name.strip().split())
    if not name: raise HTTPException(status_code=422,detail="Player name cannot be empty")
    with connect() as con:
        old=con.execute("SELECT name,score,games FROM players WHERE name=?",(name,)).fetchone()
        if old:
            con.execute("UPDATE players SET score=?,games=games+1 WHERE name=?",(max(old["score"],payload.score),old["name"]))
        else:
            con.execute("INSERT INTO players(name,score,games) VALUES(?,?,1)",(name,payload.score))
        row=con.execute("SELECT name,score,games FROM players WHERE name=?",(name,)).fetchone()
    return dict(row)
