import React from 'react'
import { Sparklines, SparklinesLine } from 'react-sparklines';
import TimeAgo from 'react-timeago'

class StockRow extends React.Component {



  render() {
    let history = this.props.stock_data.history;
    return (
      <tr>
        <td>{this.props.stock.keys}</td>
        <td>
          {this.props.stock_data.current_value.toFixed(2)}
        </td>
        <td>
          <Sparklines data={history.map((history) => { return history.value})}>
            <SparklinesLine color="blue" />
          </Sparklines>
        </td>
        <td className='updated_at'>
          <TimeAgo date={ history.slice(-1)[0].time } />
        </td>
      </tr>
    );
  }
}

export default StockRow;