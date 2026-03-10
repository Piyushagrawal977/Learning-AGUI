from fastapi import FastAPI
from pydantic import BaseModel
from agent.graph import agent_graph
from fastapi.responses import StreamingResponse

app = FastAPI()

class TaskRequest(BaseModel):
    message:str

def stream_agent(state):
    for step in agent_graph.stream(state):
        yield f"{step}\n"

@app.post("/agent")
async def run_agent(request:TaskRequest):
    state = {
        "messages":[request.message],
        "tool_result":None,
        "final_response":None,
        "decision":None
    }
    print("user input on backend", request.message)
    return StreamingResponse(
        stream_agent(state),
        media_type="text/event-stream"
    )
