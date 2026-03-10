from langchain_core.tools import tool

@tool
def task_planner_tool(task:str):
    """
    Break the task in the list of actionable steps.
    """
    steps=[
        f"Understanding of basics of {task}",
        f"Study important concept related to {task}",
        f"Practice exercises for {task}",
        f"Build a small project using {task}"
    ]

    return steps
