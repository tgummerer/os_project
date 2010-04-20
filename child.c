#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <stdlib.h>


#include "child.h"
#include "def.h"

// command is closed by \0
int child (char command []) {
  char command_exploded [2][MAX_COMMAND_LENGTH]; // Command [0] and arguments[1]

  printf("%s", command_exploded[1]);
  
  // Separating command from arguments
  //  explode_string(command, command_exploded);
  
  // Execute command
  //  printf("%s", command_exploded[1]);
  execlp (command, command, NULL);
  perror("Command was not found ");
  return EXIT_FAILURE;
}

