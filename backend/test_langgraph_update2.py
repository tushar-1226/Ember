import asyncio
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langchain_core.messages import RemoveMessage, SystemMessage, HumanMessage, AIMessage
from langgraph.checkpoint.memory import MemorySaver

class State(TypedDict):
    messages: Annotated[list, add_messages]

def agent(state):
    print("Agent called with:", state["messages"][-1].content if state["messages"] else "none")
    return {"messages": [AIMessage(content="Generated response")]}

workflow = StateGraph(State)
workflow.add_node("agent", agent)
workflow.add_edge(START, "agent")
workflow.add_edge("agent", END)
checkpointer = MemorySaver()
app = workflow.compile(checkpointer=checkpointer)

async def main():
    config = {"configurable": {"thread_id": "1"}}
    # 1. First run
    await app.ainvoke({"messages": [HumanMessage(content="Hello")]}, config)
    state = app.get_state(config)
    print("State after 1:", len(state.values["messages"]))
    
    # 2. Regenerate: remove AI message AND User message
    msgs = state.values["messages"]
    app.update_state(config, {"messages": [RemoveMessage(id=msgs[-1].id), RemoveMessage(id=msgs[-2].id)]})
    state = app.get_state(config)
    print("State after remove:", len(state.values["messages"]))
    
    # 3. Run again by sending the user message again!
    await app.ainvoke({"messages": [HumanMessage(content="Hello")]}, config)
    state = app.get_state(config)
    print("State after regenerate:", len(state.values["messages"]))

asyncio.run(main())
