#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <stdlib.h>


#include "child.h"
#include "const.h"

// command is closed by \0
int child (char command []) {
  char command_exploded [2][MAX_COMMAND_LENGTH]; // Command [0] and arguments[1]
  
  // Separating command from arguments
  explode_string(command, command_exploded);
  
  // Execute command
  execlp (command_exploded[0], command_exploded[0], NULL);// command_exploded[1]);
  perror("Command was not found\n");
  return EXIT_FAILURE;
}

// Separates the command from the argument
void explode_string (char command[], char exploded[2][MAX_COMMAND_LENGTH]) {
  int i = 0;
  for (; command[i] != ' ' && command[i] != '\0'; i++) {
    exploded[0][i] = command[i];
  }
  exploded[0][i] = '\0';

  int k = 0;
  for (i = i + 1; command[i] != '\0'; i++) {
    exploded[1][k] = command[i];
    k++;
  }

  exploded[1][k] = '\0';
}
