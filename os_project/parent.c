/**
 * @name        : parent.c
 * @author      : Thomas Gummerer
 * @version     : 0.1
 * @copyright   : Copyright (c) Thomas Gummerer 2010 | All rights reserved.
 * @license     : GPL
 */
#include <stdlib.h>
#include <stdio.h>
#include <unistd.h>
#include <sys/wait.h>

#include "parent.h"
#include "def.h"

static int nr_proc = 0;
static int running_proc;
static t_proc list [1024]; // Array, to keep the processes running in background

void parent (pid_t pid)
{
  int status;
  t_proc element;

  // Insert every new process into a array, to keep track
  element.proc_id = nr_proc;
  element.pid = pid;
  element.status = 0;

  // Running process is process newly inserted
  running_proc = nr_proc;
  
  // lollita
  list[nr_proc] = element;
  nr_proc++;
  
  waitpid(pid, &status, WUNTRACED);
  if (WIFSTOPPED(status)){
    // Child interrupted with ^Z
    printf("\nStopped: [%i]\n", list[nr_proc-1].proc_id);
    list[running_proc].status = 2;
  } else if (WIFEXITED(status) || WIFSIGNALED(status) || WIFSTOPPED(status)) {
    // child stopped or killed, remove it from the list
    // remove the process from the list completely if it's the last.
    // Reorder would consume to much time
    if (running_proc == nr_proc - 1) {
      nr_proc--;
    } else {
      list[running_proc].status = -1;
    }
  }  
}

void show_proc_list (void)
{
  int i = 0;

  for (;i < nr_proc; i++) {
    printf("[%i]\t\tpid:%i\t\t%i\n", list[i].proc_id, list[i].pid, list[i].status);
  }
}
