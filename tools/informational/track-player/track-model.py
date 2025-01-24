from dataclasses import dataclass, field
from typing import List, Optional, Sequence
from datetime import timedelta
import uuid

@dataclass
class TimeBox:
    """Represents a contiguous interval within a track: T = (t_start, n)"""
    t_start: float  # Start time relative to track's origin
    n: int         # Number of time units
    
    def duration(self, tau: float) -> float:
        """Calculate duration of timebox in seconds"""
        return self.n * tau

@dataclass
class Section:
    """Represents an ordered sequence of timeboxes: S = <T₁, T₂, ..., Tₖ>"""
    timeboxes: List[TimeBox] = field(default_factory=list)
    index: int = 0
    description: str = ""
    image_url: Optional[str] = None
    
    def duration(self, tau: float) -> float:
        """Calculate total duration of section in seconds"""
        return sum(box.duration(tau) for box in self.timeboxes)
    
    def add_timebox(self, t_start: float, n: int) -> None:
        """Add a new timebox to the section"""
        self.timeboxes.append(TimeBox(t_start, n))

@dataclass
class Track:
    """Represents a complete track: Θ = (id, desc, τ, δ, <S₁, S₂, ..., Sₘ>)"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    description: str = "undescribed"
    tau: float = 0.5  # Default time unit (0.5s)
    delta: float = 0  # Padding duration in seconds
    sections: List[Section] = field(default_factory=list)
    
    def total_duration(self) -> float:
        """Calculate total duration of track including padding"""
        sections_duration = sum(
            section.duration(self.tau) for section in self.sections
        )
        return self.delta + sections_duration
    
    def add_section(self, description: str = "", image_url: Optional[str] = None) -> Section:
        """Add a new section to the track"""
        section = Section(
            index=len(self.sections),
            description=description,
            image_url=image_url
        )
        self.sections.append(section)
        return section
    
    def validate(self) -> bool:
        """Validate track structure according to constraints"""
        for section in self.sections:
            # Check if timeboxes are contiguous and non-overlapping
            for i in range(len(section.timeboxes) - 1):
                current_box = section.timeboxes[i]
                next_box = section.timeboxes[i + 1]
                if not abs(next_box.t_start - (current_box.t_start + current_box.n * self.tau)) < 1e-6:
                    return False
        return True
