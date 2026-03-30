from pydantic import BaseModel
from typing import List

class RecommendationRequest(BaseModel):
    user_id: str
    subject: str

class RecommendedContent(BaseModel):
    title: str
    description: str
    content_type: str
    url: str

class RecommendationResponse(BaseModel):
    user_id: str
    recommendations: List[RecommendedContent]
