from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import List, Optional
from enum import Enum
import uuid

class TimeUnit:
    """Represents the indivisible temporal unit τ"""
    
    def __init__(self, duration: timedelta):
        if duration.total_seconds() <= 0:
            raise ValueError("TimeUnit duration must be positive")
        self.duration = duration

    @classmethod
    def from_milliseconds(cls, ms: int) -> 'TimeUnit':
        return cls(timedelta(milliseconds=ms))

    @classmethod
    def from_seconds(cls, s: int) -> 'TimeUnit':
        return cls(timedelta(seconds=s))

    def __mul__(self, n: int) -> timedelta:
        """Allows multiplication: timeunit * n"""
        return self.duration * n

    def __repr__(self) -> str:
        return f"TimeUnit(duration={self.duration})"


@dataclass
class TimeBox:
    """Represents a temporal interval T = (t_start, n)"""
    
    start: datetime
    number_of_timeunits: int
    
    def __post_init__(self):
        if self.number_of_timeunits < 1:
            raise ValueError("number_of_timeunits must be positive")

    def duration(self, timeunit: TimeUnit) -> timedelta:
        """Calculate duration as n * τ"""
        return timeunit * self.number_of_timeunits

    def end_time(self, timeunit: TimeUnit) -> datetime:
        """Calculate end time as start + duration"""
        return self.start + self.duration(timeunit)


class Section:
    """Represents an ordered sequence of TimeBoxes"""
    
    def __init__(self, 
                 index: int,
                 description: str,
                 section_image_url: Optional[str] = None):
        self.index = index
        self.description = description
        self.section_image_url = section_image_url
        self.timeboxes: List[TimeBox] = []

    def add_timebox(self, timebox: TimeBox, timeunit: TimeUnit) -> None:
        """Add a timebox, ensuring continuity"""
        if self.timeboxes:
            last_box = self.timeboxes[-1]
            if last_box.end_time(timeunit) != timebox.start:
                raise ValueError("TimeBoxes must be contiguous")
        self.timeboxes.append(timebox)

    def duration(self, timeunit: TimeUnit) -> timedelta:
        """Calculate total section duration"""
        return sum((box.duration(timeunit) for box in self.timeboxes), 
                  start=timedelta())

    def __repr__(self) -> str:
        return f"Section(index={self.index}, timeboxes={len(self.timeboxes)})"


class Track:
    """Represents a complete track Θ"""
    
    def __init__(self,
                 identifier: str = None,
                 description: str = "undescribed",
                 timeunit: TimeUnit = TimeUnit.from_milliseconds(500),
                 padding: timedelta = timedelta(0),
                 track_image_url: Optional[str] = None):
        self.identifier = identifier or f"untitled-track-{uuid.uuid4()}"
        self.description = description
        self.timeunit = timeunit
        self.padding = padding
        self.track_image_url = track_image_url
        self.sections: List[Section] = []

    def add_section(self, section: Section) -> None:
        """Add a section, validating index continuity"""
        expected_index = len(self.sections)
        if section.index != expected_index:
            raise ValueError(f"Section index must be {expected_index}")
        self.sections.append(section)

    def total_duration(self) -> timedelta:
        """Calculate total track duration including padding"""
        sections_duration = sum(
            (section.duration(self.timeunit) for section in self.sections),
            start=timedelta()
        )
        return self.padding + sections_duration

    def get_position_at_time(self, time: timedelta) -> tuple[Optional[Section], Optional[TimeBox]]:
        """Get the section and timebox at a given time position"""
        if time < self.padding:
            return None, None
            
        current_time = self.padding
        for section in self.sections:
            section_duration = section.duration(self.timeunit)
            if current_time <= time < current_time + section_duration:
                # Find specific timebox
                box_time = current_time
                for box in section.timeboxes:
                    box_duration = box.duration(self.timeunit)
                    if box_time <= time < box_time + box_duration:
                        return section, box
                    box_time += box_duration
            current_time += section_duration
        return None, None

    def __repr__(self) -> str:
        return f"Track(id='{self.identifier}', sections={len(self.sections)})"


# Example usage:
if __name__ == "__main__":
    # Create a track with 120 BPM (500ms timeunit)
    track = Track(
        identifier="example-track",
        description="A demo track",
        timeunit=TimeUnit.from_milliseconds(500),
        padding=timedelta(seconds=5)
    )

    # Create a section
    section = Section(0, "First section")
    
    # Add some timeboxes to the section
    start_time = datetime.now()
    for i in range(4):
        box = TimeBox(
            start=start_time + i * timedelta(seconds=2),
            number_of_timeunits=4  # 2 seconds each (4 * 500ms)
        )
        section.add_timebox(box, track.timeunit)

    # Add section to track
    track.add_section(section)

    # Print total duration
    print(f"Track duration: {track.total_duration()}")
