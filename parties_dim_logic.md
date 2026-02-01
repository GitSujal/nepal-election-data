# Parties Dim

We want to show the details about the parties and their history. 

General Details:
- Party Name
- Party Symbol
- Party Symbol URL
- Party Leader

Historical Details:
- Summary of Seats Won in Last 2 Elections (2074, 2079)
- Summary of Vote Share in Last 2 Elections (2074, 2079)
- Summary of Representatives in last 2 House of Representatives (Both FPTP and PR) (Based on dim_parliament_members)


Current Candidates Details:

For FTPTP Candidates:
- Show candidate count by following groups:
  - Qualification Level
  - Gender
  - Citizenship District 
  - Age Group
  - Count of New vs Old Candidates [ New candidatates are those who did not contest in any previous election or were memeber of the parliament in last 2 terms by both FPTP and PR]
  - Also group by all the tags and show count for each tag [Tags are defined in dim_current_fptp_candidates table]

For PR Candidates:
- Show candidate count by following groups:
  - Group them by Gender,Inclusive Group,Citizenship District,Backward Area,Disability
  - Group them by all tags and show count for each tag [Tags are defined in dim_current_pr_candidates table]

Previous Candidates Details 2079:
- Do the same for previous FTPT candidates 2079.
- We don't have previous PR candidates data but we can fetch some details from dim_parliament_members table if needed and try to compute as much as possible.

Previous Candidates Details 2074:
- Do the same for previous FTPT candidates 2074.
- We don't have previous PR candidates data but we can fetch some details from dim_parliament_members table if needed and try to compute as much as possible.


Goal, we need to be able to use this dim table to show clear history of the parties and their candidates in the frontend. We want to show how they have evolved over time and how they are using candidates from different backgrounds.


Here are few tags we calculate at party level to show in the frontend:

1. Budo Party: Icon :Old Man:
    - If the overall age of the candidates is above 55 years.

2. Same Same: Icon :Twins:
    - If more than 50% of the candidates are returning candidates.

3. Naya Anuhar: Icon :Face:
    - If more than 50% of the candidates are new candidates.
