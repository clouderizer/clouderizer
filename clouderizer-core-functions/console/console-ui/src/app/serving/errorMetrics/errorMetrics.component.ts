import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-errorMetrics',
  templateUrl: './errorMetrics.component.html',
  styleUrls: ['./errorMetrics.component.scss']
})
export class errorMetricsComponent implements OnInit {
  @Input() records;

  closeModal(action) {
		this.activeModal.close(action);
  }

  constructor( public activeModal: NgbActiveModal) { }
  ngOnInit() {
  }

}
