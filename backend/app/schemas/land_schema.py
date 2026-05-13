from pydantic import BaseModel
from typing import Dict


class LandCreate(BaseModel):

    farmer_id: int

    land_name: str

    geometry: Dict
