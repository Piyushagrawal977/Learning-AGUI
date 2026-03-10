from typing import TypedDict, List, Optional 

class AgentState(TypedDict):
    messages: List[str]
    tool_result:Optional[List[str]]
    final_response:Optional[str]
    decision:Optional[str]