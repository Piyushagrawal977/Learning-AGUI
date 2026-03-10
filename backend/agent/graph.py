from langgraph.graph import StateGraph, END
from langchain_community.chat_models import ChatOllama
from langchain_core.messages import HumanMessage

from agent.state import AgentState
from agent.tools import task_planner_tool

llm = ChatOllama(
    model="qwen2.5:7b",
    temperature=0

)


def tool_node(state:AgentState):
    user_input=state["messages"][-1]
    result = task_planner_tool.invoke({"task":user_input})

    return {
        "tool_result":result
    }



def planner_node(state: AgentState):

    user_input = state["messages"][-1]

    if state["tool_result"]:
        print("reached to planner_node")
        steps = "\n".join(state["tool_result"])

        return {
            "final_response": f"Here is your plan:\n\n{steps}",
            "decision":"Action finish"
        }
    else:
        prompt = f"""
            You are a routing agent.

            Your job is only to decide the next action.

            Rules:
            - If the user asks to plan something → respond exactly: ACTION: use_tool
            - Otherwise → respond exactly: ACTION: finish

            Do not explain.
            Do not generate the plan.
            Only return one of these two responses.

            User request:
            {user_input}
            """

        response = llm.invoke([HumanMessage(content=prompt)])
        print("response of the planner",response.content,"\n")

        return {
            "decision": response.content
        }

def route_decision(state: AgentState):

    # print("route decision state",state)
    decision = state.get("decision", "").lower()

    if "use_tool" in decision:
        return "use_tool"

    return "finish"

workflow = StateGraph(AgentState)
workflow.add_node("planner",planner_node)
workflow.add_node("tool",tool_node)
workflow.set_entry_point("planner")
workflow.add_conditional_edges(
    "planner",
    route_decision,
    {
        "use_tool": "tool",
        "finish": END
    }
)
workflow.add_edge("tool","planner")
# workflow.add_edge("planner",END)
agent_graph = workflow.compile()
