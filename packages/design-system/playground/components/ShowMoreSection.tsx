import { Button, ShowMoreText, Typography } from '~/components'

export const ShowMoreSection = () => {
  return (
    <div>
      <Typography className="mb-4" variant="headline">
        Show More Text
      </Typography>

      <div className="flex flex-col gap-4">
        <ShowMoreText
          text="Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusantium praesentium minus necessitatibus. Placeat, ratione ipsam dolor, quas iste obcaecati tenetur esse tempora quidem eveniet iure quasi repellat debitis doloribus? Distinctio iure quisquam ipsam minus dolorum corporis, eligendi iusto. Animi assumenda reprehenderit atque corrupti, a iste illo porro facilis maxime. Quod eaque ratione, ullam tempore blanditiis placeat odit, assumenda labore accusamus libero nostrum qui et architecto inventore atque, veritatis vitae nisi quas veniam sit! Quasi natus, neque sed soluta perspiciatis officiis?"
          limit={30}
        />

        <ShowMoreText
          text="Custom show more. Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusantium praesentium minus necessitatibus. Placeat, ratione ipsam dolor, quas iste obcaecati tenetur esse tempora quidem eveniet iure quasi repellat debitis doloribus? Distinctio iure quisquam ipsam minus dolorum corporis, eligendi iusto. Animi assumenda reprehenderit atque corrupti, a iste illo porro facilis maxime. Quod eaque ratione, ullam tempore blanditiis placeat odit, assumenda labore accusamus libero nostrum qui et architecto inventore atque, veritatis vitae nisi quas veniam sit! Quasi natus, neque sed soluta perspiciatis officiis?"
          limit={30}
          showMore="Please show more"
        />

        <ShowMoreText
          text="Custom show more with button. Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusantium praesentium minus necessitatibus. Placeat, ratione ipsam dolor, quas iste obcaecati tenetur esse tempora quidem eveniet iure quasi repellat debitis doloribus? Distinctio iure quisquam ipsam minus dolorum corporis, eligendi iusto. Animi assumenda reprehenderit atque corrupti, a iste illo porro facilis maxime. Quod eaque ratione, ullam tempore blanditiis placeat odit, assumenda labore accusamus libero nostrum qui et architecto inventore atque, veritatis vitae nisi quas veniam sit! Quasi natus, neque sed soluta perspiciatis officiis?"
          limit={30}
          showMore={<Button variant="secondary" size="small" icon="plus" />}
        />
      </div>
    </div>
  )
}
