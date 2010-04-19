#include <stdio.h>
#include <string.h>

#include "child.h"
#include "const.h"

// command is closed by \n\0
void child (char command []) {
  char command_exploded [2][MAX_COMMAND_LENGTH]; // Command [0] and arguments[1]
  
  // Separating command from arguments
  explode_string(command, command_exploded);

  // Execute command
  execvp(command_exploded[0], command_exploded[1]);
  return;
}

// Separates the command from the argument
void explode_string (char command[], char exploded[][]) {
  int i = 0;
  for (; command[i] != ' '; i++) {
    exploded[0][i] = command[i];
  }
  exploded[0][i + 1] = '\0';

  int k = 0;
  for (i = i + 1; command[i] != '\0'; i++) {
    exploded[1][k] = command[i];
    k++;
  }

  exploded[1][k+1] = '\0';
}
