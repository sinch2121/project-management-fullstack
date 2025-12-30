import { Inngest } from "inngest";
import prisma from "../configs/prisma.js";
import sendEmail from "../configs/nodemailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "project-management" });


const syncUserCreation = inngest.createFunction(
    {id: 'sync-user-from-clerk'},
    {event: 'clerk/user.created'},
    async ({ event })=>{
        const {data} = event
        await prisma.user.create({
            data: {
                id: data.id,
                email: data?.email_addresses[0]?.email_address,
                name: data?.first_name + " "+data?.last_name,
                image: data?.image_url,
        
            }
        })
    }
)

// Inngest function to delete user from database
const syncUserDeletion = inngest.createFunction(
    {id: 'delete-user-from-clerk'},
    {event: 'clerk/user.deleted'},
    async ({ event })=>{
        const {data} = event
        await prisma.user.delete({
            where: {
                id: data.id,
                
        
            }
        })
    }
)

//Inngest function to update user data 
const syncUserUpdation = inngest.createFunction(
    {id: 'update-user-from-clerk'},
    {event: 'clerk/user.updated'},
    async ({ event })=>{
        const {data} = event
        await prisma.user.update({
            where: {
                id: data.id,
            },
            data: {
                email: data?.email_addresses[0]?.email_addres,
                name: data?.first_name + " "+data?.last_name,
                image: data?.image_url,
            
            }
        })
    }
)

// inngest function to save workspace data to a database
const syncWorkspaceCreation = inngest.createFunction(
    {id: 'sync-workspace-from-clerk'},
    {event: 'clerk/organization.created'},
    async ({event}) => {
        const {data} = event
        await prisma.workspace.create({
            data: {
                id: data.id,
                name:data.name,
                slug: data.slug,
                ownerId: data.created_by,
                image_url: data.image_url
            }
        })

        // Add creator as ADMIN member
        await prisma.workspaceMember.create({
            data: {
                userId: data.created_by,
                workspaceId:data.id,
                role: "ADMIN"
            }
                  
        }
            
        )
    }
)

// Inngest function to update workspace adata in database
const syncWorkspaceUpdation = inngest.createFunction(
    {id: 'update-workspace-from-clerk'},
    {event: 'clerk/organization.updated'},
    async ({event}) => {
    await prisma.workspace.update({
        where: {
            id: data.id
        },
        data: {
            name:data.name,
                slug: data.slug,
                image_url: data.image_url,
        }
    })
}
)

//Inngest function to delete workspace from database
const syncWorkspaceDeletion = inngest.createFunction(
    {id: 'delete-workspace-with-clerk'},
    {event: 'clerk/organization.deleted'},
    async ({event}) => {
        const {data} = event;
        await prisma.workspace.delete({
            where: {
                id: data.id
            }
        })
    }
)



// Inngest function to save workspace mmeber data to a database
const syncWorkspaceMemberCreation = inngest.createFunction(
    {id: 'sync-workspace-member-from-clerk' },
    {event: 'clerk/organizationInvitation.accpeted'},
    async ({event}) => {
        const {data} = event;
        await prisma.workspaceMember.create({
            data: {
                userId: data.user_id,
                workspaceId: data.organization_id,
                role: String(data.role_name).toUpperCase(),
            }
        })
    }
)

// Inngest function to send email on task creation
const sendTaskAssignmentEmail = inngest.createFunction(
    {id:"send-task-assignment-mail"},
    {event: "app/task.assigned"},
    async ({event, step}) => {
        const {taskId, origin} = event.data;
        const task = await prisma.task.findUnique({
            where: {id: taskId},
            include: {assignee: true, project: true}
        })

        await sendEmail({
            to: task.assignee.email,
            subject: `New Task Assignment in ${task.project.name}`,
            body: `<div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
  <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:6px; padding:20px;">

    <h2 style="margin-top:0; color:#2f80ed;">
      New Task Assigned
    </h2>

    <p style="font-size:14px; color:#333;">
      Hello <strong>${task.assignee.name}</strong>,
    </p>

    <p style="font-size:14px; color:#333;">
      You have been assigned a new task in the project
      <strong>${task.project.name}</strong>.
    </p>

    <div style="background:#f9fafb; border:1px solid #e5e7eb; padding:12px; border-radius:4px; margin:15px 0;">
      <p style="margin:0 0 6px 0; font-size:13px;">
        <strong>Task:</strong> ${task.title}
      </p>
      <p style="margin:0; font-size:13px;">
        <strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString()}
      </p>
    </div>

    <p style="font-size:14px; color:#333;">
      Please review the task and begin work at your earliest convenience.
    </p>

    <a href="${origin}/tasks/${task.id}"
       style="display:inline-block; margin-top:10px; background:#2f80ed; color:#ffffff; padding:10px 16px; text-decoration:none; border-radius:4px; font-size:13px;">
      View Task
    </a>

    <p style="font-size:12px; color:#777; margin-top:20px;">
      — Project Management System
    </p>

  </div>
</div>`

        })

        if(new Date(task.due_date).toLocaleDateString()!== new Date().toDateString()){
            await step.sleepUntil('wait-for-the-due-date', new Date(task.due_date));

            await step.run('check-if-task-is-completed', async()=>{
                const task= await prisma.task.findUnique({
                    where: {id: taskId},
                    include: {assignee: true, project: true}
                })

                if(!task) return;


                if(task.status !== "DONE"){
                    await step.run('send-task-reminder.mail', async ()=> {
                        await sendEmail({
                            to: task.assignee.email,
                            subject: `Reminder for ${task.project.name}`,
                            body: `<div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
  <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:6px; padding:20px;">

    <h2 style="margin-top:0; color:#e5533d;">
      Task Reminder
    </h2>

    <p style="font-size:14px; color:#333;">
      Hello <strong>${task.assignee.name}</strong>,
    </p>

    <p style="font-size:14px; color:#333;">
      This is a friendly reminder to complete the following task in the project
      <strong>${task.project.name}</strong>.
    </p>

    <div style="background:#fff5f5; border:1px solid #f3c7c7; padding:12px; border-radius:4px; margin:15px 0;">
      <p style="margin:0 0 6px 0; font-size:13px;">
        <strong>Task:</strong> ${task.title}
      </p>
      <p style="margin:0; font-size:13px;">
        <strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString()}
      </p>
    </div>

    <p style="font-size:14px; color:#333;">
      The task is still marked as <strong>incomplete</strong>.  
      Please complete it as soon as possible.
    </p>

    <a href="${origin}/tasks/${task.id}"
       style="display:inline-block; margin-top:10px; background:#e5533d; color:#ffffff; padding:10px 16px; text-decoration:none; border-radius:4px; font-size:13px;">
      View Task
    </a>

    <p style="font-size:12px; color:#777; margin-top:20px;">
      — Project Management System
    </p>

  </div>
</div>`
                        })
                    })
                }
            })
        }
    }

)


// Create an empty array where we'll export future Inngest functions
export const functions = [
    syncUserCreation, 
    syncUserDeletion,
    syncUserUpdation,
    syncWorkspaceCreation,
    syncWorkspaceUpdation,
    syncWorkspaceDeletion,
    syncWorkspaceMemberCreation,
    sendTaskAssignmentEmail
];