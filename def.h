#ifndef __DEF_H__
#define __DEF_H__

#define MAX_COMMAND_LENGTH 2048

typedef struct proc {
  int proc_id; // Id in terminal (starting from 0)
  int pid; // Process id
  int status; // Status of the process (0 = foreground, 1 = background, running, 2 = background, stopped, -1 = process terminated)
} t_proc;

#endif
