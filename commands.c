/**
 * @name        : commands.c
 * @author      : Thomas Gummerer
 * @version     : 0.1
 * @description : The main program
 * @copyright   : Copyright (c) Thomas Gummerer 2010 | All rights reserved.
 * @license     : GPL
 */
#include <string.h>
#include <stdio.h>

#include "commands.h"
#include "parent.h"

void internal (char command[])
{
  if (strcmp("jobs\n", command) == 0) {
    show_proc_list();  
  }

  if (strncmp("bg", command, 2) == 0) {
    background(command);
  }

  if (strncmp("fg", command, 2) == 0) {
    foreground(command);
  }
}

void background (char command[])
{
  // Run process in background
}

void foreground (char command[])
{
  // Run process in foreground
}
