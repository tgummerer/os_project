/**
 * @name        : child.c
 * @author      : Thomas Gummerer
 * @version     : 0.1
 * @copyright   : Copyright (c) Thomas Gummerer 2010 | All rights reserved.
 * @license     : GPL
 */
#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <stdlib.h>


#include "child.h"
#include "def.h"
#include "commands.h"

char * com [MAX_COMMAND_LENGTH];
char * sep = " \t\n";
char * element;

// Executes a command, as a child process
int child (char command []) {
  int count=0;

  // Execute internal commands
  if (isInternal(command)) {
    internal (command);
    exit (0);
  }

  element = strtok (command, sep);
  while (element != NULL)
  {
    com[count] = element;
    count++;
    com[count] = NULL;
    element = strtok (NULL, sep);
  }
  
  // Execute command
  execvp (com[0], com);
  perror("Command was not found");
  return EXIT_FAILURE;
}

// Checks if the command is a internal command, which is executed by the shell directly
int isInternal (char command[]) {
  if (strncmp("jobs", command, 4) == 0 || strncmp("bg", command, 2) == 0 || strncmp("fg", command, 2) == 0 || strncmp("in", command, 2) == 0 || strncmp("out", command, 3) == 0)
    return 1;
  
  return 0;
}
