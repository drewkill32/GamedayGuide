<template>
  <div class="schedule-container">
    <div class="day-grid" v-for="day in schedule" :key="day.date.toISOString()">
      <h4 class="title">
        {{
          day.date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })
        }}
      </h4>
      <div class="title"></div>
      <div class="time title" v-for="h in HOURS" :key="h">
        {{ h }}
      </div>

      <template v-for="outlet in day.outlets" :key="outlet.name">
        <div
          class="outlet"
          :style="`grid-row: ${
            startingIndexMap[`${day.date.toLocaleDateString()}-${outlet.name}`]
              .startIndex + 3
          } / ${
            startingIndexMap[`${day.date.toLocaleDateString()}-${outlet.name}`]
              .endIndex + 3
          } `"
        >
          {{ outlet.name }}
        </div>
        <!-- <div
          class="markers"
          v-for="(h, index) in HOURS"
          :key="h"
          :style="`grid-column: ${
            2 + index * cellsPerHour
          } / span ${cellsPerHour} `"
        ></div> -->

        <div
          class="game"
          v-for="game in outlet.games"
          :key="game.id"
          :style="
            getGridColumn(
              game,
              startingIndexMap[
                `${day.date.toLocaleDateString()}-${outlet.name}`
              ],
              outlet.games
            )
          "
        >
          <TeamLogo
            :team="game.awayTeam"
            :time="getGameStartTime(game.startTime)"
          />
          @
          <TeamLogo
            :team="game.homeTeam"
            :time="getGameEndTime(game.startTime)"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from "fs";
import { computed, onMounted } from "vue";
import { Game, Schedule } from "../../shared/schema";
import { HOURS } from "../utils";
import TeamLogo from "./TeamLogo.vue";

const { schedule } = defineProps<{ schedule: Schedule[] }>();

const getGameStartTime = (date: Date) => {
  return date.toLocaleTimeString("en-US", {
    hour12: true,
    hour: "numeric",
    minute: "numeric",
  });
};

const getGameEndTime = (date: Date) => {
  return new Date(date.getTime() + 210 * 60000).toLocaleTimeString("en-US", {
    hour12: true,
    hour: "numeric",
    minute: "numeric",
  });
};

const startingIndexMap = computed(() => {
  const ele: Record<string, { startIndex: number; endIndex: number }> = {};
  for (let i = 0; i < schedule.length; i++) {
    const day = schedule[i];
    let nextIndex = 0;
    for (let j = 0; j < day.outlets.length; j++) {
      const outlet = day.outlets[j];
      // outlet.startIndex = nextIndex;
      // outlet.endIndex = nextIndex += overlapCount;
      const overlapCount = getOverlapCount(outlet.games);
      ele[`${day.date.toLocaleDateString()}-${outlet.name}`] = {
        startIndex: nextIndex,
        endIndex: (nextIndex += overlapCount),
      };
    }
  }
  console.table(ele);
  return ele;
});

const getOverlapCount = (games: Game[]) => {
  let count = 1;

  for (let i = 0; i < games.length; i++) {
    for (let j = i + 1; j < games.length; j++) {
      const range1 = games[i];
      const range2 = games[j];
      const range1StartTime = range1.startTime;
      const range2StartTime = range2.startTime;
      const range1EndTime = new Date(range1.startTime.getTime() + 210 * 60000);
      const range2EndTime = new Date(range2.startTime.getTime() + 210 * 60000);

      if (
        range1.awayTeam.abbreviation === "MONM" ||
        range2.awayTeam.abbreviation === "MONM"
      ) {
        console.log(range1.awayTeam.abbreviation, range2.awayTeam.abbreviation);
      }
      // Check for overlap
      if (range1EndTime > range2StartTime && range1StartTime < range2EndTime) {
        count++;
        break;
      }
    }
  }

  return count;
};

const cellsPerHour = 4;
const totalCells = HOURS.length * cellsPerHour;
const gameLengthHours = 3.5;

onMounted(() => {
  console.table(startingIndexMap.value);
});

const getGridColumn = (
  currGame: Game,
  indexes: { startIndex: number; endIndex: number },
  games: Game[]
) => {
  //get the count of games that overlap with this game

  const currentGameStart = currGame.startTime;
  const currentGameEnd = new Date(currentGameStart.getTime() + 210 * 60000);
  const gameIndex = games.findIndex((g) => g.id === currGame.id);

  const overlapCount = games.slice(0, gameIndex).filter((g) => {
    const start = new Date(g.startTime);
    const end = new Date(start.getTime() + 210 * 60000);
    return (
      (currentGameStart == start && currentGameEnd == end) ||
      (currentGameStart > start && currentGameStart < end) ||
      (currentGameStart < start && currentGameEnd > start)
    );
  }).length;

  const startColumn = getStartColumn(currentGameStart);
  return `grid-area: ${
    indexes.startIndex + 3 + overlapCount
  }  / ${startColumn} / auto / ${
    startColumn + gameLengthHours * cellsPerHour
  };`;
};

const getStartColumn = (date: Date) => {
  const firstColumn = 11;
  const offset = 2;
  const startColumn =
    (date.getHours() - firstColumn) * cellsPerHour +
    offset +
    Math.round(date.getMinutes() / (60 / cellsPerHour));

  return startColumn;
};
</script>

<style scoped lang="scss">
.schedule-container {
  width: 100%;
  padding-inline: 10px;
  overflow-x: auto;
  min-width: 900px;
}
.day-grid {
  width: 100%;
  display: grid;
  grid-template-columns: 150px repeat(v-bind(totalCells), 1fr);
  grid-template-rows: 1fr;
  text-align: center;
  font-size: 1rem;

  & > h4 {
    margin: 0;
    grid-column: 1 / -1;
    column-gap: 0;
  }

  .time {
    width: 100%;
    font-size: 1rem;
    grid-column: span v-bind(cellsPerHour);
  }
  .outlet {
    grid-column: 1;
    align-self: center;
    text-align: center;
    margin-block: auto;
    height: 100%;
    padding-right: 0.25rem;
    border-right: 1px solid #333;
    position: sticky;
    left: 0;
  }

  .markers {
    background-color: red;
  }

  .game {
    background-color: #eee;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: row;
    gap: 2rem;
    padding-block: 0.5rem;
  }

  .title {
    background-color: #333;
    color: #fff;
  }
  .outlet-name {
    font-size: 0.5rem;
  }
}
</style>
